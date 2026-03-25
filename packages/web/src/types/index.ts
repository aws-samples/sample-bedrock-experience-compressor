export interface Insight {
  id: string;
  insightId: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: string;
  actions?: Action[];
  action?: string;
  notes?: string;
  modifiedAction?: string;
  dismissReason?: string;
}

export interface Action {
  id: string;
  type: ActionType;
  description: string;
  status: 'pending' | 'completed';
}

export type ActionType = 'update_runbook' | 'schedule_training' | 'order_parts' | 'escalate';
