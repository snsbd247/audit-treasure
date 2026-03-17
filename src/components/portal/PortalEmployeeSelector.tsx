import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

interface Props {
  employees: Employee[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function PortalEmployeeSelector({ employees, selectedId, onSelect }: Props) {
  if (employees.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
      <Badge variant="outline" className="gap-1 text-xs shrink-0">
        <Shield className="w-3 h-3" />
        Admin View
      </Badge>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="w-[280px] h-8 text-sm">
          <SelectValue placeholder="Select employee" />
        </SelectTrigger>
        <SelectContent>
          {employees.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              {emp.first_name} {emp.last_name} ({emp.employee_code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
