import { UserRole } from '../types';

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  restaurantId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
  authorizedModules: string[];
  password?: string;
}
