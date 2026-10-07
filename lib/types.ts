export type Role = 'ADMIN' | 'MANAGER' | 'AGENT';
export interface SessionUser {
  userId: string; email: string; role: Role; name: string; referenceId: string;
}
export interface TeamMember {
  id: string; reference_id: string; name: string; email: string; role: Role;
  specialization: string | null; skills: string[] | null;
}
export interface Task {
  id: string; project_id: string; title: string; description: string | null;
  assignee_id: string; deadline: string; estimated_hours: number;
  assignee: { name: string; specialization: string | null };
}
export interface Project {
  id: string; name: string; client_name: string; description: string | null;
  manager_id: string; deadline: string; created_at: string;
  manager: { name: string; email: string }; tasks: Task[]; taskCount: number;
}
export interface CreatedProject { id: string; name: string; taskCount: number }
