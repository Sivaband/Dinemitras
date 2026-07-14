import { useState, useCallback } from 'react';
import { Employee } from '../models/Employee';
import { EmployeeService } from '../services/EmployeeService';
import { useAppState } from '../state';

export function useEmployeeViewModel() {
  const { selectedRestaurantId, addSystemNotification } = useAppState();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const service = new EmployeeService();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getEmployees(selectedRestaurantId);
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurantId]);

  const createEmployee = useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'authorizedModules'> & { password?: string }) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const newEmp = await service.createEmployee(employeeData);
      setSuccessMessage(`Employee ${newEmp.fullName} created successfully.`);
      addSystemNotification(`👤 Added staff member: ${newEmp.fullName} (${newEmp.role.toUpperCase()})`);
      await fetchEmployees(); // auto refresh
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Failed to create employee.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, addSystemNotification]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await service.updateEmployee(id, updates);
      setSuccessMessage(`Employee ${updated.fullName} updated successfully.`);
      addSystemNotification(`👤 Staff member details updated.`);
      await fetchEmployees(); // auto refresh
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Failed to update employee.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, addSystemNotification]);

  const deleteEmployee = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await service.deleteEmployee(id);
      setSuccessMessage(`Employee deleted successfully.`);
      addSystemNotification(`👤 Staff member removed.`);
      await fetchEmployees(); // auto refresh
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Failed to delete employee.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, addSystemNotification]);

  const toggleEmployeeStatus = useCallback(async (id: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    setLoading(true);
    setError(null);
    try {
      const updated = await service.toggleEmployeeStatus(id, nextStatus);
      addSystemNotification(`👤 ${updated.fullName} is now ${nextStatus === 'active' ? 'ENABLED' : 'DISABLED'}.`);
      await fetchEmployees(); // auto refresh
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Failed to toggle employee status.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, addSystemNotification]);

  return {
    employees,
    loading,
    error,
    successMessage,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
  };
}
