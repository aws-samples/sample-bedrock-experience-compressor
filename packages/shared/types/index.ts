// Shared TypeScript interfaces for all teams

export interface Task {
  taskId: string;
  title: string;
  description: string;
  location: string;
  scheduledDate: string;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high';
  status: 'assigned' | 'in_progress' | 'blocked' | 'completed';
  runbookId: string;
  runbookVersion: string;
  runbookS3Path: string;
  assignedTo: string;
  startedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  reportId: string;
  taskId: string;
  technicianId: string;
  runbookId: string;
  runbookVersion: string;
  startedAt: string;
  completedAt: string;
  actualDuration: number;
  everythingOk: boolean;
  hadDelays: boolean;
  delayReason?: string;
  runbookRating: number;
  comments?: string;
  s3ReportPath: string;
  photos: string[];
  createdAt: string;
}

export interface Technician {
  technicianId: string;
  userId?: string;
  name: string;
  email: string;
  cognitoUsername?: string;
  phone?: string;
  status?: string;
  skills: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Runbook {
  runbookId: string;
  title: string;
  version: string;
  s3Path: string;
  ownerId: string;
  category: string;
  estimatedDuration: number;
  requiredTools: string[];
  createdAt: string;
  updatedAt: string;
}
