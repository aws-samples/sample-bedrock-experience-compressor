import expertApi from './expertApi';

export interface Proposal {
  proposalId: string;
  title: string;
  procedureCode: string;
  runbookId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  affectedSteps: number[];
  modificationType: string;
  createdAt: string;
  stepDetails: {
    stepNumber: number;
    stepTitle: string;
    currentInstruction: string;
    proposedInstruction: string;
    rationale: string;
  };
  newToolsRequired?: Array<{
    toolName: string;
    specification: string;
    quantity: number;
  }>;
  timeAdjustmentMinutes: number;
  safetyImpact?: string;
  complianceReferences?: string[];
  evidence: {
    frequency: number;
    severity: string;
    reportIds: string[];
  };
  expertName?: string;
  expertComments?: string;
  reviewedAt?: string;
  appliedAt?: string;
  appliedVersion?: string;
}

export const getProposals = async (status: string = 'all'): Promise<Proposal[]> => {
  const response = await expertApi.get(`/api/expert/proposals?status=${status}`);
  return response.data.proposals;
};

export const getProposal = async (proposalId: string): Promise<Proposal> => {
  const response = await expertApi.get(`/api/expert/proposals/${proposalId}`);
  return response.data;
};

export const updateProposal = async (
  proposalId: string,
  action: 'approve' | 'reject',
  expertName: string,
  comments?: string
): Promise<void> => {
  await expertApi.post(`/api/expert/proposals/${proposalId}`, {
    action,
    expertName,
    comments,
  });
};

export const triggerAnalysis = async (): Promise<{message: string; timestamp: string}> => {
  const response = await expertApi.post<{message: string; timestamp: string; executionArn: string}>('/api/expert/trigger-analysis', {});
  return response.data;
};
