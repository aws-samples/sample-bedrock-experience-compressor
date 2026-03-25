import managerApi from './managerApi';

export interface Insight {
  insightId: string;
  description: string;
  issueType: 'tool' | 'equipment' | 'process' | 'documentation' | 'resource';
  frequency: number;
  reportIds: string[];
  recommendedAction: string;
  status: 'new' | 'in-progress' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  managerActions: ManagerAction[];
}

export interface ManagerAction {
  actionType: 'accept' | 'dismiss' | 'modify' | 'resolve';
  timestamp: string;
  managerId: string;
  notes?: string;
  modifiedAction?: string;
}

export interface InsightFilters {
  issueType?: string[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TrendData {
  period: {
    start: string;
    end: string;
    label: string;
  };
  toolIssueFrequency: number;
  equipmentIssueFrequency: number;
  reportsWithIssues: number;
  totalReports: number;
  issueRate: number;
}

export interface TrendComparison {
  current: TrendData;
  previous: TrendData;
  changes: {
    [metric: string]: {
      value: number;
      direction: 'improving' | 'degrading' | 'stable';
    };
  };
}

export const getInsights = async (): Promise<Insight[]> => {
  const response = await managerApi.get<{insights: Insight[]}>(`/api/manager/insights`);
  return response.data.insights || [];
};

export const getInsightById = async (id: string): Promise<Insight> => {
  const response = await managerApi.get<Insight>(`/api/manager/insights/${id}`);
  return response.data;
};

export const updateInsight = async (
  id: string,
  action: {
    action: 'accept' | 'dismiss' | 'modify' | 'resolve';
    notes?: string;
    modifiedAction?: string;
    dismissReason?: string;
  }
): Promise<Insight> => {
  const response = await managerApi.put<{insight: Insight; message: string}>(`/api/manager/insights/${id}`, action);
  return response.data.insight;
};

export const getTrends = async (period: '7d' | '30d' | '90d' | '1y'): Promise<TrendComparison> => {
  const response = await managerApi.get<TrendComparison>(`/api/manager/trends?period=${period}`);
  return response.data;
};

export const triggerAnalysis = async (): Promise<{message: string; timestamp: string}> => {
  const response = await managerApi.post<{message: string; timestamp: string}>(`/api/manager/analysis`, {});
  return response.data;
};

export interface AnalysisJob {
  jobId: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
  trigger: 'scheduled' | 'manual';
  reportsAnalyzed?: number;
  insightsGenerated?: number;
  errorMessage?: string;
}

export const getAnalysisHistory = async (): Promise<AnalysisJob[]> => {
  const response = await managerApi.get<{jobs: AnalysisJob[]}>(`/api/manager/analysis`);
  return response.data.jobs || [];
};

export const getRunbookMetrics = async () => {
  const response = await managerApi.get('/api/manager/runbook-metrics');
  return response.data.metrics;
};

export const getTeamMetrics = async () => {
  const response = await managerApi.get('/api/manager/team-metrics');
  return response.data.technicians;
};

export interface PlanningTask {
  taskId: string;
  title: string;
  location: string;
  scheduledDate: string;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high';
  status: 'assigned' | 'in_progress' | 'blocked' | 'completed';
}

export interface PlanningTechnician {
  technicianId: string;
  name: string;
  tasks: PlanningTask[];
}

export interface PlanningData {
  week: string;
  weekStart: string;
  weekEnd: string;
  technicians: PlanningTechnician[];
}

export const getPlanning = async (week?: string): Promise<PlanningData> => {
  const params = week ? `?week=${week}` : '';
  const response = await managerApi.get<PlanningData>(`/api/manager/planning${params}`);
  return response.data;
};

// Report Metrics
export interface MonthlyTrendPoint {
  month: string;
  interventions: number;
  delays: number;
  delayRate: number;
  avgDuration: number;
  avgEstimated: number;
  avgRating: number;
}

export interface ReportMetrics {
  totalReports: number;
  successRate: number;
  delayRate: number;
  avgRating: number;
  ratingDistribution: Record<string, number>;
  delayReasons: Record<string, number>;
  monthlyTrend: MonthlyTrendPoint[];
}

export const getReportMetrics = async (): Promise<ReportMetrics> => {
  const response = await managerApi.get<ReportMetrics>('/api/manager/report-metrics');
  return response.data;
};

// Monthly Planning
export interface MonthlyPlanningData {
  month: string;
  monthStart: string;
  monthEnd: string;
  daysInMonth: number;
  technicians: PlanningTechnician[];
}

export const getMonthlyPlanning = async (month?: string): Promise<MonthlyPlanningData> => {
  const params = month ? `?month=${month}` : '';
  const response = await managerApi.get<MonthlyPlanningData>(`/api/manager/planning/monthly${params}`);
  return response.data;
};

// Admin: Reset Demo (scoped or full)
export type ResetScope = 'all' | 'tasks' | 'proposals' | 'insights';

export const resetDemo = async (scope: ResetScope = 'all'): Promise<{ message: string; results: Record<string, number> }> => {
  const params = scope !== 'all' ? `?scope=${scope}` : '';
  const response = await managerApi.post<{ message: string; results: Record<string, number> }>(`/api/admin/reset-demo${params}`, {});
  return response.data;
};
