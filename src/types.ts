export type Role = 'CEO' | 'COO' | 'Head of Science';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: Role;
}

export type ProjectStatus = 'Backlog' | 'In Progress' | 'Review' | 'Completed';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  deadline?: string;
  createdBy: string;
  createdAt: string;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Done';

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string;
  deadline: string;
  createdAt: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveType = 'Sick Leave' | 'Casual Leave' | 'Other';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  reason: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  createdAt: string;
}

export type AccountingType = 'Credit' | 'Debit';

export interface AccountingRecord {
  id: string;
  title: string;
  amount: number;
  type: AccountingType;
  date: string;
  employeeId: string;
  status: 'Pending' | 'Verified';
  description?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storagePath: string;
  uploadedBy: string;
  uploaderName: string;
  uploadedAt: string;
}
