export type AdminRole = "teacher" | "admin" | "superadmin";

export interface AdminProfile {
  id: string;
  full_name: string;
  role: AdminRole;
  created_at: string;
}

export type StudentStatus = "active" | "suspended" | "inactive";

export interface Student {
  id: string;
  student_number: string;
  full_name: string;
  course: string | null;
  year_level: number;
  status: StudentStatus;
  created_at: string;
}

export type ComputerStatus = "online" | "offline" | "maintenance";

export interface Computer {
  id: string;
  hostname: string;
  location: string | null;
  status: ComputerStatus;
  os_info: string | null;
  last_seen: string | null;
  created_at: string;
}

export type SessionStatus = "active" | "closed" | "terminated";

export interface LabSession {
  id: string;
  student_id: string | null;
  computer_id: string | null;
  login_at: string;
  logout_at: string | null;
  duration_minutes: number | null;
  status: SessionStatus;
  created_at: string;
  students?: Pick<Student, "full_name" | "student_number">;
  computers?: Pick<Computer, "hostname" | "location">;
}

export type ViolationSeverity = "info" | "warning" | "critical";

export interface Violation {
  id: string;
  student_id: string | null;
  computer_id: string | null;
  session_id: string | null;
  type: string;
  description: string;
  severity: ViolationSeverity;
  created_at: string;
  students?: Pick<Student, "full_name" | "student_number">;
  computers?: Pick<Computer, "hostname">;
}
