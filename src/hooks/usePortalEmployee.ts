import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  [key: string]: any;
}

/**
 * Hook for portal pages: resolves the employee record for the current user.
 * - Regular users: looks up employee by user_id
 * - Admin/SuperAdmin: can select any employee via a dropdown
 */
export function usePortalEmployee() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const isHrAdmin = isSuperAdmin || hasPermission("hrm", "can_view");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Fetch own employee record
  const fetchOwnEmployee = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("employees" as any)
      .select("*")
      .eq("user_id", user.id)
      .single();
    return data as Employee | null;
  }, [user]);

  // Fetch all employees (for admin selector)
  const fetchAllEmployees = useCallback(async () => {
    const { data } = await supabase
      .from("employees" as any)
      .select("id, employee_code, first_name, last_name")
      .eq("status", "active")
      .order("first_name");
    return (data || []) as Employee[];
  }, []);

  // Fetch full employee by id
  const fetchEmployeeById = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("employees" as any)
      .select("*")
      .eq("id", id)
      .single();
    return data as Employee | null;
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    (async () => {
      if (isHrAdmin) {
        // Admin: load all employees + try to find own
        const [ownEmp, allEmps] = await Promise.all([
          fetchOwnEmployee(),
          fetchAllEmployees(),
        ]);
        setAllEmployees(allEmps);

        if (ownEmp) {
          setEmployee(ownEmp);
          setSelectedEmployeeId(ownEmp.id);
        } else if (allEmps.length > 0) {
          // Default to first employee
          const full = await fetchEmployeeById(allEmps[0].id);
          setEmployee(full);
          setSelectedEmployeeId(allEmps[0].id);
        }
      } else {
        // Regular user: only own employee
        const ownEmp = await fetchOwnEmployee();
        setEmployee(ownEmp);
        if (ownEmp) setSelectedEmployeeId(ownEmp.id);
      }
      setLoading(false);
    })();
  }, [user, isHrAdmin, fetchOwnEmployee, fetchAllEmployees, fetchEmployeeById]);

  // When admin changes selection
  const selectEmployee = useCallback(async (id: string) => {
    setSelectedEmployeeId(id);
    const full = await fetchEmployeeById(id);
    setEmployee(full);
  }, [fetchEmployeeById]);

  return {
    employee,
    loading,
    isHrAdmin,
    allEmployees,
    selectedEmployeeId,
    selectEmployee,
    hasEmployee: !!employee,
  };
}
