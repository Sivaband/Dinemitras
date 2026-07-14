import { Employee } from '../models/Employee';
import { IEmployeeRepository, LocalEmployeeRepository } from '../repositories/EmployeeRepository';

export class EmployeeService {
  private repository: IEmployeeRepository;

  constructor(repository: IEmployeeRepository = new LocalEmployeeRepository()) {
    this.repository = repository;
  }

  private async simulateNetwork(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 500)); // 500ms simulated API network latency
  }

  async getEmployees(restaurantId: string): Promise<Employee[]> {
    await this.simulateNetwork();
    return this.repository.getAll(restaurantId);
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    await this.simulateNetwork();
    return this.repository.getById(id);
  }

  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'authorizedModules'> & { password?: string }): Promise<Employee> {
    await this.simulateNetwork();
    return this.repository.create(employee);
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    await this.simulateNetwork();
    return this.repository.update(id, updates);
  }

  async deleteEmployee(id: string): Promise<boolean> {
    await this.simulateNetwork();
    return this.repository.delete(id);
  }

  async toggleEmployeeStatus(id: string, status: 'active' | 'inactive'): Promise<Employee> {
    return this.updateEmployee(id, { status });
  }

  async assignEmployeeRole(id: string, role: any): Promise<Employee> {
    return this.updateEmployee(id, { role });
  }
}
