import { Employee } from '../models/Employee';
import { UserRole, UserProfile, getAuthorizedModulesForRole } from '../types';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';

export interface IEmployeeRepository {
  getAll(restaurantId: string): Promise<Employee[]>;
  getById(id: string): Promise<Employee | null>;
  create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'authorizedModules'> & { password?: string }): Promise<Employee>;
  update(id: string, updates: Partial<Employee>): Promise<Employee>;
  delete(id: string): Promise<boolean>;
}

export class LocalEmployeeRepository implements IEmployeeRepository {
  private getStorageUsers(): UserProfile[] {
    const data = localStorage.getItem('qr_users');
    return data ? JSON.parse(data) : [];
  }

  private saveStorageUsers(users: UserProfile[]): void {
    localStorage.setItem('qr_users', JSON.stringify(users));
    // Dispatch custom event to notify state.tsx context of updates in real time
    window.dispatchEvent(new CustomEvent('qr_users_updated', { detail: users }));
  }

  private saveCurrentUser(user: UserProfile | null): void {
    if (user) {
      localStorage.setItem('qr_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qr_current_user');
    }
    // Dispatch custom event to notify state.tsx context of currentUser updates in real time
    window.dispatchEvent(new CustomEvent('qr_current_user_updated', { detail: user }));
  }

  private mapProfileToEmployee(profile: UserProfile): Employee {
    return {
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone || '',
      role: profile.role,
      status: profile.status || 'active',
      restaurantId: profile.restaurantId || '',
      branchId: profile.branchId,
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: profile.createdAt || new Date().toISOString(), // fallback
      authorizedModules: getAuthorizedModulesForRole(profile.role),
    };
  }

  async getAll(restaurantId: string): Promise<Employee[]> {
    const users = this.getStorageUsers();
    return users
      .filter((u) => u.restaurantId === restaurantId && u.role !== UserRole.SUPER_ADMIN && u.role !== UserRole.RESTAURANT_ADMIN)
      .map(this.mapProfileToEmployee);
  }

  async getById(id: string): Promise<Employee | null> {
    const users = this.getStorageUsers();
    const user = users.find((u) => u.id === id);
    return user ? this.mapProfileToEmployee(user) : null;
  }

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'authorizedModules'> & { password?: string }): Promise<Employee> {
    const users = this.getStorageUsers();
    const exists = users.some((u) => u.email.toLowerCase() === employee.email.toLowerCase().trim());
    if (exists) {
      throw new Error('Email address already registered.');
    }

    const newProfile: UserProfile = {
      id: `user_${Date.now()}`,
      email: employee.email.toLowerCase().trim(),
      fullName: employee.fullName,
      phone: employee.phone,
      role: employee.role,
      restaurantId: employee.restaurantId,
      branchId: employee.branchId,
      createdAt: new Date().toISOString(),
      isVerified: true,
      onboardingStep: 5,
      password: employee.password || 'staff123',
      status: employee.status,
    };

    users.push(newProfile);
    this.saveStorageUsers(users);
    return this.mapProfileToEmployee(newProfile);
  }

  async update(id: string, updates: Partial<Employee>): Promise<Employee> {
    const users = this.getStorageUsers();
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      throw new Error('Employee not found.');
    }

    const currentProfile = users[userIndex];
    const updatedProfile: UserProfile = {
      ...currentProfile,
      fullName: updates.fullName !== undefined ? updates.fullName : currentProfile.fullName,
      email: updates.email !== undefined ? updates.email.toLowerCase().trim() : currentProfile.email,
      phone: updates.phone !== undefined ? updates.phone : currentProfile.phone,
      role: updates.role !== undefined ? updates.role : currentProfile.role,
      status: updates.status !== undefined ? updates.status : currentProfile.status,
      branchId: updates.branchId !== undefined ? updates.branchId : currentProfile.branchId,
      password: updates.password !== undefined ? updates.password : currentProfile.password,
    };

    users[userIndex] = updatedProfile;
    this.saveStorageUsers(users);

    // Sync with currently logged-in user if they updated themselves
    const currentSessionUser = localStorage.getItem('qr_current_user');
    if (currentSessionUser) {
      const parsed = JSON.parse(currentSessionUser);
      if (parsed.id === id) {
        const withModules = {
          ...updatedProfile,
          authorizedModules: getAuthorizedModulesForRole(updatedProfile.role)
        };
        this.saveCurrentUser(withModules);
      }
    }

    return this.mapProfileToEmployee(updatedProfile);
  }

  async delete(id: string): Promise<boolean> {
    const users = this.getStorageUsers();
    return true;
  }
}

// Helper to convert non-UUID strings to deterministic UUIDs for consistency across Supabase operations
const toUUID = (id: string): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || uuidRegex.test(id)) return id;

  let hex = '';
  for (let i = 0; i < id.length; i++) {
    hex += id.charCodeAt(i).toString(16);
  }

  if (hex.length < 32) {
    hex = hex.padEnd(32, '0');
  } else {
    // FNV-1a 32-bit hash of the entire original string to guarantee uniqueness
    let h = 2166136261 >>> 0;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const hashHex = (h >>> 0).toString(16).padStart(8, '0');
    hex = hex.substring(0, 24) + hashHex;
  }

  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
};

export class SupabaseEmployeeRepository implements IEmployeeRepository {
  private mapProfileToEmployee(row: any): Employee {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone || '',
      role: row.role as UserRole,
      status: (row.status || 'active') as 'active' | 'inactive',
      restaurantId: row.restaurant_id || '',
      branchId: row.branch_id || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.created_at || new Date().toISOString(),
      authorizedModules: getAuthorizedModulesForRole(row.role),
    };
  }

  async getAll(restaurantId: string): Promise<Employee[]> {
    const rId = toUUID(restaurantId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('restaurant_id', rId)
      .not('role', 'in', '("super_admin","restaurant_admin")');

    if (error) {
      console.error('Error fetching employees from Supabase:', error.message);
      throw error;
    }

    if (!data) return [];
    return data.map((row: any) => this.mapProfileToEmployee(row));
  }

  async getById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching employee by ID from Supabase:', error.message);
      return null;
    }

    return data ? this.mapProfileToEmployee(data) : null;
  }

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'authorizedModules'> & { password?: string }): Promise<Employee> {
    const password = employee.password || 'staff123';
    const email = employee.email.toLowerCase().trim();
    const fullName = employee.fullName;
    const role = employee.role;
    const phone = employee.phone || '';
    const restaurantId = employee.restaurantId ? toUUID(employee.restaurantId) : null;
    const branchId = employee.branchId ? toUUID(employee.branchId) : null;
    const status = employee.status || 'active';

    // 1. Check if email already registered in profiles (case-insensitive)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existing) {
      throw new Error('Email address already registered.');
    }

    let finalId = '';
    
    try {
      // Create a secondary client for silent auth signup so we do not disrupt current admin session
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        { auth: { persistSession: false } }
      );

      const { data, error: signUpErr } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName,
            role,
            restaurantId,
            branchId,
            onboardingStep: 5
          }
        }
      });

      if (signUpErr || !data.user) {
        console.warn("Auth signup failed, inserting directly to profiles:", signUpErr?.message);
        finalId = toUUID(`user_${Date.now()}`);
      } else {
        finalId = data.user.id;
      }
    } catch (authErr: any) {
      console.warn("Auth signup exception, inserting directly to profiles:", authErr.message);
      finalId = toUUID(`user_${Date.now()}`);
    }

    // 2. Insert into profiles
    const { error: profileErr } = await supabase.from('profiles').insert([{
      id: finalId,
      full_name: fullName,
      email,
      phone,
      role,
      restaurant_id: restaurantId,
      branch_id: branchId,
      status,
      profile_image: `pwd:${password}`
    }]);

    if (profileErr) {
      console.error("Direct profile insert failed:", profileErr.message);
      if (profileErr.code === '23505' || profileErr.message?.includes('duplicate key') || profileErr.message?.includes('profiles_email_key')) {
        throw new Error('Email address already registered.');
      }
      throw new Error(`Database insert failed: ${profileErr.message}`);
    }

    // Create returned employee object
    const newEmp: Employee = {
      id: finalId,
      fullName,
      email,
      phone,
      role: role as UserRole,
      status: status as 'active' | 'inactive',
      restaurantId: restaurantId || '',
      branchId: branchId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorizedModules: getAuthorizedModulesForRole(role),
    };

    // Synchronize local storage so the client state and listeners stay perfectly updated
    try {
      const localUsersStr = localStorage.getItem('qr_users');
      const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];
      const newProfile: UserProfile = {
        id: finalId,
        email,
        fullName,
        phone,
        role: role as UserRole,
        restaurantId: restaurantId || undefined,
        branchId: branchId || undefined,
        createdAt: newEmp.createdAt,
        isVerified: true,
        onboardingStep: 5,
        password,
        status: status as 'active' | 'inactive',
      };
      
      const updatedUsers = localUsers.filter(u => u.email.toLowerCase() !== email);
      updatedUsers.push(newProfile);
      localStorage.setItem('qr_users', JSON.stringify(updatedUsers));
      window.dispatchEvent(new CustomEvent('qr_users_updated', { detail: updatedUsers }));
    } catch (localErr) {
      console.warn("Failed to synchronize local storage user profile:", localErr);
    }

    return newEmp;
  }

  async update(id: string, updates: Partial<Employee>): Promise<Employee> {
    const updatePayload: any = {};
    if (updates.fullName !== undefined) updatePayload.full_name = updates.fullName;
    if (updates.email !== undefined) updatePayload.email = updates.email.toLowerCase().trim();
    if (updates.phone !== undefined) updatePayload.phone = updates.phone;
    if (updates.role !== undefined) updatePayload.role = updates.role;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.branchId !== undefined) updatePayload.branch_id = updates.branchId ? toUUID(updates.branchId) : null;

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('Error updating employee in Supabase:', error.message);
      throw error;
    }

    // Retrieve updated profile
    const { data: updatedData, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !updatedData) {
      throw new Error(`Failed to refetch updated profile: ${fetchErr?.message || 'Not found'}`);
    }

    const updatedEmp = this.mapProfileToEmployee(updatedData);

    // Sync LocalStorage & dispatch event
    try {
      const localUsersStr = localStorage.getItem('qr_users');
      if (localUsersStr) {
        const localUsers: UserProfile[] = JSON.parse(localUsersStr);
        const updatedUsers = localUsers.map((u) => {
          if (u.id === id) {
            return {
              ...u,
              fullName: updatedEmp.fullName,
              email: updatedEmp.email,
              phone: updatedEmp.phone,
              role: updatedEmp.role,
              status: updatedEmp.status,
              branchId: updatedEmp.branchId || undefined,
            };
          }
          return u;
        });
        localStorage.setItem('qr_users', JSON.stringify(updatedUsers));
        window.dispatchEvent(new CustomEvent('qr_users_updated', { detail: updatedUsers }));
      }
    } catch (localErr) {
      console.warn("Failed to synchronize updated profile in local storage:", localErr);
    }

    return updatedEmp;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting employee from Supabase:', error.message);
      throw error;
    }

    // Sync LocalStorage & dispatch event
    try {
      const localUsersStr = localStorage.getItem('qr_users');
      if (localUsersStr) {
        const localUsers: UserProfile[] = JSON.parse(localUsersStr);
        const filtered = localUsers.filter((u) => u.id !== id);
        localStorage.setItem('qr_users', JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('qr_users_updated', { detail: filtered }));
      }
    } catch (localErr) {
      console.warn("Failed to synchronize deleted profile in local storage:", localErr);
    }

    return true;
  }
}

