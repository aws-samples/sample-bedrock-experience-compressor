import { useState, useEffect } from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import ReactMarkdown from 'react-markdown';
import {
  AppLayout, ContentLayout, Container, Header, Table, Box, SpaceBetween,
  Badge, StatusIndicator, Select, Alert, ColumnLayout, Input, Pagination, CollectionPreferences,
  Modal, Button, Textarea,
} from '@cloudscape-design/components';
import { getProposals, getProposal, updateProposal, triggerAnalysis, Proposal } from '../../services/expert';
import expertApi from '../../services/expertApi';
import AppHeader from '../../components/AppHeader';
import Chatbot from '../../components/Chatbot';

// ─── Runbook Viewer Modal ───
function RunbookModal({ runbookId, visible, onDismiss }: {
  runbookId: string; visible: boolean; onDismiss: () => void;
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && runbookId) {
      setLoading(true);
      setError('');

      expertApi.get(`/api/expert/runbooks/${runbookId}`, { responseType: 'text', transformResponse: [(data: string) => data] })
        .then(r => setContent(r.data))
        .catch((e) => setError(e.response?.data?.error || e.message || 'Failed to load runbook'))
        .finally(() => setLoading(false));
    }
  }, [visible, runbookId]);

  return (
    <Modal visible={visible} onDismiss={onDismiss} size="max" header={`Runbook: ${runbookId}`}>
      {loading ? (
        <Box padding="l">Loading runbook...</Box>
      ) : error ? (
        <Alert type="error">{error}</Alert>
      ) : (
        <div style={{ maxHeight: '78vh', overflowY: 'auto', padding: '20px' }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </Modal>
  );
}

// ─── Proposal Detail Modal ───
function ProposalModal({ proposalId, visible, onDismiss, onAction }: {
  proposalId: string; visible: boolean; onDismiss: () => void; onAction: (msg: string) => void;
}) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRunbook, setShowRunbook] = useState(false);

  useEffect(() => {
    if (visible && proposalId) {
      setLoading(true); setComments(''); setError('');
      getProposal(proposalId).then(setProposal).catch(() => setProposal(null)).finally(() => setLoading(false));
    }
  }, [visible, proposalId]);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !comments.trim()) { setError('Please provide comments when rejecting'); return; }
    setSubmitting(true); setError('');
    try {
      await updateProposal(proposalId, action, 'Current User', comments);
      onAction(action === 'approve' ? '✅ Proposal approved! Runbook update in progress (~30s). Use Refresh to check status.' : '❌ Proposal rejected.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(`Failed to ${action}: ${msg}`);
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <Modal visible={visible} onDismiss={onDismiss} size="max" header="🔍 Proposal Review">
        {loading ? <Box padding="l">Loading...</Box> : !proposal ? <Box>Proposal not found</Box> : (
          <div style={{ maxHeight: '78vh', overflowY: 'auto' }}>
            <SpaceBetween size="l">
              {/* Header */}
              <Container>
                <SpaceBetween size="m">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                      <Badge color={proposal.priority === 'critical' ? 'red' : 'blue'}>{proposal.priority.toUpperCase()}</Badge>
                      <Box variant="h2">{proposal.title}</Box>
                    </div>
                    <Button iconName="file" onClick={() => setShowRunbook(true)}>View Runbook</Button>
                  </div>
                  <ColumnLayout columns={3}>
                    <div><Box variant="awsui-key-label">Procedure</Box><div>{proposal.procedureCode}</div></div>
                    <div><Box variant="awsui-key-label">Affected Steps</Box><div>Step {proposal.affectedSteps.join(', ')}</div></div>
                    <div><Box variant="awsui-key-label">Type</Box><div>{proposal.modificationType.replace(/_/g, ' ')}</div></div>
                  </ColumnLayout>
                </SpaceBetween>
              </Container>

            {/* Evidence */}
            {proposal.evidence && (
              <Container header={<Header variant="h3">📊 Evidence</Header>}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: '#EBF5FF', borderRadius: '8px', border: '2px solid #60A5FA' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px', background: 'white', borderRadius: '8px', minWidth: '120px' }}>
                    <Box fontSize="heading-xl" fontWeight="bold" color="text-status-info">{proposal.evidence.frequency}</Box>
                    <Box fontSize="body-s" color="text-body-secondary">Technicians</Box>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px', background: 'white', borderRadius: '8px', minWidth: '120px' }}>
                    <Box fontSize="heading-xl" fontWeight="bold" color="text-status-info">{proposal.evidence.reportIds.length}</Box>
                    <Box fontSize="body-s" color="text-body-secondary">Field Reports</Box>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px', background: 'white', borderRadius: '8px' }}>
                    <Badge color={proposal.evidence.severity === 'critical' ? 'red' : proposal.evidence.severity === 'high' ? 'blue' : 'grey'}>
                      {proposal.evidence.severity.toUpperCase()}
                    </Badge>
                    <Box fontSize="body-s" color="text-body-secondary" padding={{ top: 'xxs' }}>Severity</Box>
                  </div>
                </div>
              </Container>
            )}

            {/* Step Modification */}
            {proposal.stepDetails && (
              <Container header={<Header variant="h3">🔧 Step {proposal.stepDetails.stepNumber}: {proposal.stepDetails.stepTitle}</Header>}>
                <SpaceBetween size="m">
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <Badge color="red">CURRENT</Badge>
                      <Box variant="awsui-key-label">Current Instruction</Box>
                    </div>
                    <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '8px', border: '2px solid #FCA5A5', fontSize: '14px', lineHeight: '1.6' }}>
                      {proposal.stepDetails.currentInstruction}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <Badge color="green">PROPOSED</Badge>
                      <Box variant="awsui-key-label">Proposed Instruction</Box>
                    </div>
                    <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '8px', border: '2px solid #86EFAC', fontSize: '14px', lineHeight: '1.6' }}>
                      {proposal.stepDetails.proposedInstruction}
                    </div>
                  </div>
                  <Alert type="info" header="Rationale">
                    {proposal.stepDetails.rationale}
                  </Alert>
                </SpaceBetween>
              </Container>
            )}

            {/* New Tools */}
            {(proposal.newToolsRequired?.length ?? 0) > 0 && (
              <Container header={<Header variant="h3">🛠️ New Tools Required</Header>}>
                <SpaceBetween size="s">
                  {proposal.newToolsRequired?.map((tool, idx) => (
                    <div key={idx} style={{ padding: '16px', background: '#FEF9E7', borderRadius: '8px', border: '1px solid #F4D03F' }}>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{tool.toolName}</div>
                      <div style={{ fontSize: '14px', color: '#687078' }}>{tool.specification} • Qty: {tool.quantity}</div>
                    </div>
                  ))}
                </SpaceBetween>
              </Container>
            )}

            {/* Impact */}
            <Container header={<Header variant="h3">⚖️ Impact Analysis</Header>}>
              <SpaceBetween size="m">
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1, padding: '20px', background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)', borderRadius: '12px', color: 'white' }}>
                    <Box fontSize="body-s" fontWeight="bold" color="inherit" padding={{ bottom: 'xs' }}>TIME ADJUSTMENT</Box>
                    <Box fontSize="display-l" fontWeight="heavy" color="inherit">
                      {proposal.timeAdjustmentMinutes > 0 ? '+' : ''}{proposal.timeAdjustmentMinutes} min
                    </Box>
                  </div>
                  {proposal.safetyImpact && (
                    <div style={{ flex: 2, padding: '20px', background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)', borderRadius: '12px', color: 'white' }}>
                      <Box fontSize="body-s" fontWeight="bold" color="inherit" padding={{ bottom: 'xs' }}>SAFETY IMPACT</Box>
                      <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'white' }}>
                        {proposal.safetyImpact}
                      </div>
                    </div>
                  )}
                </div>

                {(proposal.complianceReferences?.length ?? 0) > 0 && (
                  <div style={{ padding: '20px', background: '#F0F9FF', borderRadius: '12px', border: '2px solid #3B82F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Badge color="blue">COMPLIANCE</Badge>
                      <Box variant="h4">Regulatory References</Box>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '24px', lineHeight: '1.8' }}>
                      {proposal.complianceReferences?.map((ref, i) => (
                        <li key={i} style={{ fontSize: '14px', color: '#1E40AF' }}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </SpaceBetween>
            </Container>

            {/* Expert Review */}
            <Container header={<Header variant="h3">👨‍🔬 Expert Review</Header>}>
              <SpaceBetween size="m">
                {error && <Alert type="error" dismissible onDismiss={() => setError('')}>{error}</Alert>}
                {proposal.status !== 'pending' ? (
                  <SpaceBetween size="s">
                    <Alert type={proposal.status === 'approved' ? 'success' : 'error'}
                      header={proposal.status === 'approved' ? '✅ Approved' : '❌ Rejected'}>
                      <SpaceBetween size="xs">
                        <div><strong>By:</strong> {proposal.expertName || 'Unknown'}</div>
                        <div><strong>At:</strong> {proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleString() : 'N/A'}</div>
                        {proposal.expertComments && <div><strong>Comments:</strong> {proposal.expertComments}</div>}
                      </SpaceBetween>
                    </Alert>
                    {proposal.status === 'approved' && !proposal.appliedAt && (
                      <Alert type="warning" header="Runbook update in progress">
                        The runbook is being updated by AI (~30s). Click "View Runbook" after a moment to see the changes.
                      </Alert>
                    )}
                    {proposal.status === 'approved' && proposal.appliedAt && (
                      <Alert type="info">
                        Runbook updated to version <strong>{proposal.appliedVersion?.startsWith('v') ? proposal.appliedVersion : `v${proposal.appliedVersion}`}</strong> on {new Date(proposal.appliedAt).toLocaleString()}
                      </Alert>
                    )}
                  </SpaceBetween>
                ) : (
                  <>
                    <Textarea value={comments} onChange={({ detail }) => setComments(detail.value)}
                      placeholder="Add your comments or feedback..." rows={3} />
                    <SpaceBetween direction="horizontal" size="s">
                      <Button variant="primary" onClick={() => handleAction('approve')} loading={submitting}>✓ Approve</Button>
                      <Button onClick={() => handleAction('reject')} loading={submitting}>✗ Reject</Button>
                    </SpaceBetween>
                  </>
                )}
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </div>
      )}
      </Modal>

      {proposal && <RunbookModal runbookId={proposal.runbookId} visible={showRunbook} onDismiss={() => setShowRunbook(false)} />}
    </>
  );
}

// ─── Main Page ───
export default function ProposalsList() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const filtered = proposals.filter(p =>
    (!searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.procedureCode?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (typeFilter === 'all' || p.modificationType === typeFilter)
  );

  const { items, collectionProps, paginationProps } = useCollection(filtered, {
    sorting: { defaultState: { sortingColumn: { sortingField: 'createdAt' }, isDescending: true } },
    pagination: { pageSize },
  });

  useEffect(() => { loadProposals(); }, [statusFilter]);

  const loadProposals = async () => {
    setLoading(true);
    try { setProposals(await getProposals(statusFilter)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleTriggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      await triggerAnalysis();
      setSuccessMessage('✅ Analysis started! New proposals will appear shortly.');
      setTimeout(() => loadProposals(), 3000); // Reload after 3s
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setSuccessMessage('');
      setErrorMessage(`Failed to trigger analysis: ${msg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { color: 'red' | 'blue' | 'grey'; label: string }> = {
      critical: { color: 'red', label: 'CRITICAL' }, high: { color: 'blue', label: 'HIGH' },
      medium: { color: 'grey', label: 'MEDIUM' }, low: { color: 'grey', label: 'LOW' },
    };
    const { color, label } = config[priority] || { color: 'grey' as const, label: priority?.toUpperCase() };
    return <Badge color={color}>{label}</Badge>;
  };

  const stats = {
    pending: proposals.filter(p => p.status === 'pending').length,
    approved: proposals.filter(p => p.status === 'approved').length,
    total: proposals.length,
    types: new Set(proposals.map(p => p.modificationType)).size,
  };

  return (
    <>
      <AppHeader />
      <Chatbot />
      <AppLayout navigationHide toolsHide content={
        <ContentLayout header={<Header variant="h1">🎓 Expert Dashboard</Header>}>
          <SpaceBetween size="l">
            {successMessage && <Alert type="success" dismissible onDismiss={() => setSuccessMessage('')}>{successMessage}</Alert>}
            {errorMessage && <Alert type="error" dismissible onDismiss={() => setErrorMessage('')}>{errorMessage}</Alert>}

            <Container header={<Header variant="h3" actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button loading={loading} onClick={loadProposals} iconName="refresh">Refresh</Button>
                <Button variant="primary" loading={analyzing} onClick={handleTriggerAnalysis} iconName="status-positive">Trigger Analysis</Button>
              </SpaceBetween>
            }>📊 Proposals Overview</Header>}>
              <ColumnLayout columns={4} variant="text-grid">
                <div style={{ padding: '16px', backgroundColor: '#DBEAFE', border: '2px solid #93C5FD', borderRadius: '8px', textAlign: 'center' }}>
                  <Box fontSize="heading-xl" fontWeight="bold">{stats.total}</Box><Box fontSize="body-s" fontWeight="bold">📋 Total</Box>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#FEF3C7', border: '2px solid #FCD34D', borderRadius: '8px', textAlign: 'center' }}>
                  <Box fontSize="heading-xl" fontWeight="bold">{stats.pending}</Box><Box fontSize="body-s" fontWeight="bold">🔴 Pending</Box>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#D1FAE5', border: '2px solid #6EE7B7', borderRadius: '8px', textAlign: 'center' }}>
                  <Box fontSize="heading-xl" fontWeight="bold">{stats.approved}</Box><Box fontSize="body-s" fontWeight="bold">✅ Approved</Box>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#EDE9FE', border: '2px solid #C4B5FD', borderRadius: '8px', textAlign: 'center' }}>
                  <Box fontSize="heading-xl" fontWeight="bold">{stats.types}</Box><Box fontSize="body-s" fontWeight="bold">⚠️ Types</Box>
                </div>
              </ColumnLayout>
            </Container>

            <Container header={<Header variant="h3">📋 Proposals</Header>}>
              <SpaceBetween size="l">
                <SpaceBetween size="s">
                  <Input value={searchQuery} onChange={({ detail }) => setSearchQuery(detail.value)} placeholder="Search by title or procedure code..." type="search" />
                  <SpaceBetween direction="horizontal" size="xs">
                    <Select selectedOption={{ label: statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1), value: statusFilter }}
                      onChange={({ detail }) => setStatusFilter(detail.selectedOption.value || 'all')}
                      options={[{ label: 'All Status', value: 'all' }, { label: 'Pending', value: 'pending' }, { label: 'Approved', value: 'approved' }, { label: 'Rejected', value: 'rejected' }]} />
                    <Select selectedOption={{ label: typeFilter === 'all' ? 'All Types' : typeFilter, value: typeFilter }}
                      onChange={({ detail }) => setTypeFilter(detail.selectedOption.value || 'all')}
                      options={[{ label: 'All Types', value: 'all' }, ...Array.from(new Set(proposals.map(p => p.modificationType))).filter(Boolean).map(t => ({ label: t.replace(/_/g, ' '), value: t }))]} />
                  </SpaceBetween>
                </SpaceBetween>

                <Table sortingColumn={collectionProps.sortingColumn} sortingDescending={collectionProps.sortingDescending} onSortingChange={collectionProps.onSortingChange} loading={loading}
                  columnDefinitions={[
                    { id: 'priority', header: 'Priority', width: 100, sortingField: 'priority', cell: (item) => getPriorityBadge(item.priority) },
                    { id: 'title', header: 'Proposal', sortingField: 'title',
                      cell: (item) => <Box><div style={{ fontWeight: 600 }}>{item.title}</div><div style={{ fontSize: '12px', color: '#687078' }}>{item.procedureCode} • Steps {item.affectedSteps?.join(', ')}</div></Box> },
                    { id: 'type', header: 'Type', width: 150, sortingField: 'modificationType', cell: (item) => item.modificationType?.replace(/_/g, ' ') },
                    { id: 'date', header: 'Created', width: 120, sortingField: 'createdAt', cell: (item) => new Date(item.createdAt).toLocaleDateString() },
                    { id: 'status', header: 'Status', width: 180, sortingField: 'status',
                      cell: (item) => item.status === 'approved' && !item.appliedAt
                        ? <StatusIndicator type="in-progress">Updating runbook...</StatusIndicator>
                        : item.status === 'approved'
                        ? <StatusIndicator type="success">Applied ({item.appliedVersion?.startsWith('v') ? item.appliedVersion : `v${item.appliedVersion}`})</StatusIndicator>
                        : <StatusIndicator type={item.status === 'rejected' ? 'error' : 'pending'}>{item.status}</StatusIndicator> },
                    { id: 'action', header: 'Action', width: 200,
                      cell: (item) => <div style={{ minWidth: '120px' }}><Button variant={item.status === 'pending' ? 'primary' : 'normal'} fullWidth onClick={(e) => { e.stopPropagation(); setSelectedId(item.proposalId); setShowDetail(true); }}>{item.status === 'pending' ? '🔍 Review' : '📄 View'}</Button></div> },
                  ]}
                  items={items}
                  empty={<Box textAlign="center"><b>No proposals found</b></Box>}
                  onRowClick={({ detail }) => { setSelectedId(detail.item.proposalId); setShowDetail(true); }}
                  pagination={<Pagination currentPageIndex={paginationProps.currentPageIndex} pagesCount={paginationProps.pagesCount} onChange={paginationProps.onChange} />}
                  preferences={<CollectionPreferences title="Preferences" confirmLabel="Confirm" cancelLabel="Cancel" pageSizePreference={{ title: 'Items per page', options: [{ value: 5, label: '5' }, { value: 10, label: '10' }, { value: 20, label: '20' }, { value: 50, label: '50' }] }} preferences={{ pageSize }} onConfirm={({ detail }) => setPageSize(detail.pageSize ?? 10)} />}
                />
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </ContentLayout>
      } />

      <ProposalModal proposalId={selectedId} visible={showDetail}
        onDismiss={() => setShowDetail(false)}
        onAction={(msg) => { setShowDetail(false); setSuccessMessage(msg); loadProposals(); }} />
    </>
  );
}
