import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppLayout,
  ContentLayout,
  Header,
  Container,
  SpaceBetween,
  Box,
  Badge,
  Button,
  Textarea,
  Alert,
  ColumnLayout,
} from '@cloudscape-design/components';
import { getProposal, updateProposal, Proposal } from '../../services/expert';
import AppHeader from '../../components/AppHeader';
import Chatbot from '../../components/Chatbot';

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProposal();
  }, [id]);

  const loadProposal = async () => {
    if (!id) return;
    try {
      const data = await getProposal(id);
      setProposal(data);
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!id) return;
    if (action === 'reject' && !comments.trim()) {
      setErrorMessage('Please provide comments when rejecting');
      return;
    }
    setErrorMessage('');
    setSubmitting(true);
    try {
      await updateProposal(id, action, 'Current User', comments);
      const message = action === 'approve' 
        ? '✅ Proposal approved successfully! Runbook has been updated to the new version.'
        : '❌ Proposal rejected.';
      navigate(`/expert/proposals?success=${encodeURIComponent(message)}`);
    } catch (error) {
      console.error(`Error ${action}ing proposal:`, error);
      setErrorMessage(`Failed to ${action} proposal`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !proposal) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <AppHeader />
      <Chatbot />
      <AppLayout
      navigationHide
      toolsHide
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
              actions={
                <Button onClick={() => navigate('/expert/proposals')}>
                  ← Back to List
                </Button>
              }
            >
              Proposal Review
            </Header>
          }
        >
          <SpaceBetween size="l">
            {errorMessage && <Alert type="error" dismissible onDismiss={() => setErrorMessage('')}>{errorMessage}</Alert>}
            {/* Header Info */}
            <Container>
              <SpaceBetween size="m">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Badge color={proposal.priority === 'critical' ? 'red' : 'blue'}>
                    {proposal.priority.toUpperCase()}
                  </Badge>
                  <Box variant="h2">{proposal.title}</Box>
                </div>
                <ColumnLayout columns={3}>
                  <div>
                    <Box variant="awsui-key-label">Procedure</Box>
                    <div>{proposal.procedureCode}</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Affected Steps</Box>
                    <div>Step {proposal.affectedSteps.join(', ')}</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Type</Box>
                    <div>{proposal.modificationType.replace(/_/g, ' ')}</div>
                  </div>
                </ColumnLayout>
              </SpaceBetween>
            </Container>

            {/* Evidence */}
            {proposal.evidence && (
              <Container header={<Header variant="h2">Evidence</Header>}>
                <Alert type="info">
                  <strong>{proposal.evidence.frequency} technicians</strong> reported this issue
                  across <strong>{proposal.evidence.reportIds.length} field reports</strong>
                  <br />
                  Severity: <strong>{proposal.evidence.severity}</strong>
                </Alert>
              </Container>
            )}

            {/* Step Modification */}
            {proposal.stepDetails && (
            <Container header={<Header variant="h2">Step {proposal.stepDetails.stepNumber}: {proposal.stepDetails.stepTitle}</Header>}>
              <SpaceBetween size="m">
                <div>
                  <Box variant="awsui-key-label">Current Instruction</Box>
                  <Box padding={{ top: 'xs' }}>
                    <div style={{ 
                      background: '#FEF2F2', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid #FCA5A5'
                    }}>
                      {proposal.stepDetails.currentInstruction}
                    </div>
                  </Box>
                </div>

                <div>
                  <Box variant="awsui-key-label">Proposed Instruction</Box>
                  <Box padding={{ top: 'xs' }}>
                    <div style={{ 
                      background: '#F0FDF4', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid #86EFAC'
                    }}>
                      {proposal.stepDetails.proposedInstruction}
                    </div>
                  </Box>
                </div>

                <div>
                  <Box variant="awsui-key-label">Rationale</Box>
                  <Box padding={{ top: 'xs' }}>{proposal.stepDetails.rationale}</Box>
                </div>
              </SpaceBetween>
            </Container>
            )}

            {/* New Tools */}
            {proposal.newToolsRequired && proposal.newToolsRequired.length > 0 && (
              <Container header={<Header variant="h2">New Tools Required</Header>}>
                <SpaceBetween size="s">
                  {proposal.newToolsRequired.map((tool, idx) => (
                    <div key={idx} style={{ 
                      padding: '12px', 
                      background: '#F9FAFB', 
                      borderRadius: '8px' 
                    }}>
                      <div style={{ fontWeight: 600 }}>{tool.toolName}</div>
                      <div style={{ fontSize: '14px', color: '#687078' }}>
                        {tool.specification} • Qty: {tool.quantity}
                      </div>
                    </div>
                  ))}
                </SpaceBetween>
              </Container>
            )}

            {/* Impact */}
            <Container header={<Header variant="h2">Impact Analysis</Header>}>
              <ColumnLayout columns={2}>
                <div>
                  <Box variant="awsui-key-label">Time Adjustment</Box>
                  <div>{proposal.timeAdjustmentMinutes > 0 ? '+' : ''}{proposal.timeAdjustmentMinutes} minutes</div>
                </div>
                {proposal.safetyImpact && (
                  <div>
                    <Box variant="awsui-key-label">Safety Impact</Box>
                    <div>{proposal.safetyImpact}</div>
                  </div>
                )}
              </ColumnLayout>
              {proposal.complianceReferences && proposal.complianceReferences.length > 0 && (
                <Box padding={{ top: 'm' }}>
                  <Box variant="awsui-key-label">Compliance References</Box>
                  <ul style={{ marginTop: '8px' }}>
                    {proposal.complianceReferences.map((ref, idx) => (
                      <li key={idx}>{ref}</li>
                    ))}
                  </ul>
                </Box>
              )}
            </Container>

            {/* Expert Review */}
            <Container header={<Header variant="h2">Expert Review</Header>}>
              <SpaceBetween size="m">
                {proposal.status !== 'pending' ? (
                  <Alert
                    type={proposal.status === 'approved' ? 'success' : 'error'}
                    header={proposal.status === 'approved' ? '✅ Proposal Approved' : '❌ Proposal Rejected'}
                  >
                    <SpaceBetween size="xs">
                      <div>
                        <strong>Reviewed by:</strong> {proposal.expertName || 'Unknown'}
                      </div>
                      <div>
                        <strong>Reviewed at:</strong> {proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleString() : 'N/A'}
                      </div>
                      {proposal.expertComments && (
                        <div>
                          <strong>Comments:</strong> {proposal.expertComments}
                        </div>
                      )}
                    </SpaceBetween>
                  </Alert>
                ) : (
                  <>
                    <Textarea
                      value={comments}
                      onChange={({ detail }) => setComments(detail.value)}
                      placeholder="Add your comments or feedback..."
                      rows={4}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Button
                        variant="primary"
                        onClick={() => handleAction('approve')}
                        loading={submitting}
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        onClick={() => handleAction('reject')}
                        loading={submitting}
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  </>
                )}
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </ContentLayout>
      }
    />
    </>
  );
}
