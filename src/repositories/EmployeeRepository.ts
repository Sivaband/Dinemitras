import { Employee } from '../models/Employee';
import { UserRole, UserProfile, getAuthorizedModulesForRole } from '../types';

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
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) {
      return false;
    }
    this.saveStorageUsers(filtered);

    // If currently logged-in user got deleted, log them out
    const currentSessionUser = localStorage.getItem('qr_current_user');
    if (currentSessionUser) {
      const parsed = JSON.parse(currentSessionUser);
      if (parsed.id === id) {
        this.saveCurrentUser(null);
      }
    }

    return true;
  }
}
