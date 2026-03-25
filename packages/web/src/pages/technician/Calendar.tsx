import { useState, useEffect } from 'react';
import { getTasks, getTask, updateTaskStatus } from '../../services/tasks';
import { Task } from '@xp-compressor/shared';
import { getIdToken } from '../../services/auth';
import AppHeader from '../../components/AppHeader';
import Chatbot from '../../components/Chatbot';
import PhotoUpload from '../../components/PhotoUpload';
import ReactMarkdown from 'react-markdown';
import technicianApi from '../../services/technicianApi';
import {
  Container, Header, Box, SpaceBetween, ColumnLayout, Grid,
  Input, Select, Button, Table, Badge, StatusIndicator, Pagination, CollectionPreferences,
  Modal, FormField, RadioGroup, Textarea, Checkbox, Alert,
} from '@cloudscape-design/components';
import { useCollection } from '@cloudscape-design/collection-hooks';

// ─── Report Viewer Modal ───
function ReportModal({ taskId, visible, onDismiss, onViewRunbook }: { taskId: string; visible: boolean; onDismiss: () => void; onViewRunbook?: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && taskId) {
      setLoading(true);
      technicianApi.get(`/api/technician/reports?taskId=${taskId}`).then(async (res) => {
        const reports = res.data.reports || [];
        const r = reports.sort((a: any, b: any) => (b.completedAt || '').localeCompare(a.completedAt || ''))[0];
        setReport(r);
        if (r?.photos?.length) {
          const urls = await Promise.all(r.photos.map(async (p: string) => {
            const v = await technicianApi.post('/api/technician/photos/view-url', { photoUrl: p });
            return v.data.viewUrl;
          }));
          setPhotoUrls(urls);
        }
      }).catch(() => setReport(null)).finally(() => setLoading(false));
    }
  }, [visible, taskId]);

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      size="large"
      header="📄 Completion Report"
      footer={
        onViewRunbook && (
          <Box float="right">
            <Button onClick={() => { onDismiss(); onViewRunbook(); }}>📖 View Runbook</Button>
          </Box>
        )
      }
    >
      {loading ? <Box>Loading...</Box> : !report ? <Box>No report found</Box> : (
        <SpaceBetween size="m">
          <ColumnLayout columns={2} variant="text-grid">
            <div><Box variant="awsui-key-label">Completed</Box><Box>{new Date(report.completedAt).toLocaleString()}</Box></div>
            <div><Box variant="awsui-key-label">Duration</Box><Box>{report.actualDuration} min</Box></div>
            <div><Box variant="awsui-key-label">Everything OK?</Box><Badge color={report.everythingOk ? 'green' : 'red'}>{report.everythingOk ? 'YES' : 'NO'}</Badge></div>
            <div><Box variant="awsui-key-label">Delays?</Box><Badge color={report.hadDelays ? 'red' : 'green'}>{report.hadDelays ? 'YES' : 'NO'}</Badge></div>
          </ColumnLayout>
          {report.hadDelays && report.delayReason && <Box><Box variant="h3">Delay Reason</Box>{report.delayReason}</Box>}
          <Box><Box variant="h3">Runbook Rating</Box><Box fontSize="heading-l">{'⭐'.repeat(report.runbookRating)}{'☆'.repeat(5 - report.runbookRating)} ({report.runbookRating}/5)</Box></Box>
          {report.comments && <Box><Box variant="h3">Comments</Box><Box><ReactMarkdown>{report.comments}</ReactMarkdown></Box></Box>}
          {photoUrls.length > 0 && (
            <Box><Box variant="h3">Photos ({photoUrls.length})</Box>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {photoUrls.map((url, i) => <img key={i} src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', borderRadius: '8px', border: '1px solid #ddd' }} />)}
              </div>
            </Box>
          )}
        </SpaceBetween>
      )}
    </Modal>
  );
}

// ─── Task Detail Modal ───
function TaskDetailModal({ taskId, visible, onDismiss, onStart }: { taskId: string; visible: boolean; onDismiss: () => void; onStart: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && taskId) {
      setLoading(true);
      getTask(taskId).then(setTask).catch(() => setTask(null)).finally(() => setLoading(false));
    }
  }, [visible, taskId]);

  return (
    <Modal visible={visible} onDismiss={onDismiss} size="medium" header={task?.title || 'Task Detail'}
      footer={task && task.status !== 'completed' && (
        <Box float="right"><Button variant="primary" onClick={onStart}>
          {task.status === 'assigned' ? 'Start Task' : '📖 Continue Task'}
        </Button></Box>
      )}>
      {loading ? <Box>Loading...</Box> : !task ? <Box>Task not found</Box> : (
        <SpaceBetween size="m">
          <ColumnLayout columns={2} variant="text-grid">
            <div><Box variant="awsui-key-label">Location</Box><Box>📍 {task.location}</Box></div>
            <div><Box variant="awsui-key-label">Priority</Box><Badge color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'blue' : 'green'}>{task.priority.toUpperCase()}</Badge></div>
            <div><Box variant="awsui-key-label">Scheduled</Box><Box>{new Date(task.scheduledDate).toLocaleString()}</Box></div>
            <div><Box variant="awsui-key-label">Duration</Box><Box>{task.estimatedDuration} min</Box></div>
            <div><Box variant="awsui-key-label">Runbook</Box><Box>📖 {task.runbookId} v{task.runbookVersion}</Box></div>
            <div><Box variant="awsui-key-label">Status</Box><StatusIndicator type={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'in-progress' : 'pending'}>{task.status.replace('_', ' ')}</StatusIndicator></div>
          </ColumnLayout>
          <Box><Box variant="awsui-key-label">Description</Box>{task.description}</Box>
        </SpaceBetween>
      )}
    </Modal>
  );
}

// ─── Runbook + Report Split View Modal ───
function RunbookModal({ taskId, visible, onDismiss, onComplete, readOnly = false }: { taskId: string; visible: boolean; onDismiss: () => void; onComplete: () => void; readOnly?: boolean }) {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Report form
  const [everythingOk, setEverythingOk] = useState('yes');
  const [hadDelays, setHadDelays] = useState('no');
  const [delayReason, setDelayReason] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [issueTools, setIssueTools] = useState(false);
  const [issueSteps, setIssueSteps] = useState(false);
  const [issueTime, setIssueTime] = useState(false);
  const [issueSafety, setIssueSafety] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible && taskId) {
      setLoading(true);
      setError('');
      setSuccess(false);
      fetch(`${import.meta.env.VITE_API_URL}/api/technician/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${getIdToken()}` },
      }).then(r => r.json()).then(async (data) => {
        if (data.runbook?.markdownUrl) {
          const md = await fetch(data.runbook.markdownUrl);
          setMarkdown(await md.text());
        } else setError('No runbook found');
      }).catch(e => setError(e.message)).finally(() => setLoading(false));
    }
  }, [visible, taskId]);

  const handleSubmit = async () => {
    setSubmitError(''); setSubmitting(true);
    try {
      const issues = [];
      if (issueTools) issues.push('Missing tools');
      if (issueSteps) issues.push('Missing steps');
      if (issueTime) issues.push('Incorrect time estimate');
      if (issueSafety) issues.push('Safety concerns');
      await technicianApi.post('/api/technician/reports', {
        taskId, everythingOk: everythingOk === 'yes', hadDelays: hadDelays === 'yes',
        delayReason: hadDelays === 'yes' ? delayReason : undefined, runbookRating: rating,
        comments: issues.length > 0 ? `Issues: ${issues.join(', ')}\n\n${comments}` : comments, photos,
      });
      setSuccess(true);
      setTimeout(() => { onComplete(); }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setSubmitError(error.response?.data?.error || error.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const emojiRatings = [
    { value: 1, emoji: '😟', label: 'Poor' }, { value: 2, emoji: '😐', label: 'Fair' },
    { value: 3, emoji: '🙂', label: 'OK' }, { value: 4, emoji: '😊', label: 'Good' }, { value: 5, emoji: '😃', label: 'Great' },
  ];

  return (
    <Modal visible={visible} onDismiss={onDismiss} size="max" header="📖 Runbook & Completion Report">
      {loading ? <Box padding="l">Loading runbook...</Box> : error ? <Alert type="error">{error}</Alert> : (
        <Grid gridDefinition={[{ colspan: 7 }, { colspan: 5 }]}>
          <div style={{ maxHeight: '75vh', overflowY: 'auto', padding: '0 12px', borderRight: '1px solid #e9ebed' }}>
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
          <div style={{ maxHeight: '75vh', overflowY: 'auto', padding: '0 12px' }}>
            {readOnly ? (
              <SpaceBetween size="m">
                <Header variant="h3">📖 Runbook Reference</Header>
                <Alert type="info">This task is already completed. You are viewing this runbook for reference only.</Alert>
              </SpaceBetween>
            ) : (
              <SpaceBetween size="m">
                <Header variant="h3">📝 Completion Report</Header>
                {success && <Alert type="success">✅ Report submitted! Closing...</Alert>}
                {submitError && <Alert type="error" dismissible onDismiss={() => setSubmitError('')}>{submitError}</Alert>}
                <FormField label="Everything OK?">
                <RadioGroup value={everythingOk} onChange={({ detail }) => setEverythingOk(detail.value)}
                  items={[{ value: 'yes', label: '👍 Yes' }, { value: 'no', label: '👎 No' }]} />
              </FormField>
              <FormField label="Any delays?">
                <RadioGroup value={hadDelays} onChange={({ detail }) => setHadDelays(detail.value)}
                  items={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
              </FormField>
              {hadDelays === 'yes' && <Textarea value={delayReason} onChange={({ detail }) => setDelayReason(detail.value)} placeholder="What caused the delay?" rows={2} />}
              <FormField label="Issues encountered">
                <SpaceBetween size="xs">
                  <Checkbox checked={issueTools} onChange={({ detail }) => setIssueTools(detail.checked)}>🔧 Missing tools</Checkbox>
                  <Checkbox checked={issueSteps} onChange={({ detail }) => setIssueSteps(detail.checked)}>📝 Missing steps</Checkbox>
                  <Checkbox checked={issueTime} onChange={({ detail }) => setIssueTime(detail.checked)}>⏰ Wrong time estimate</Checkbox>
                  <Checkbox checked={issueSafety} onChange={({ detail }) => setIssueSafety(detail.checked)}>🛡️ Safety concerns</Checkbox>
                </SpaceBetween>
              </FormField>
              <FormField label="Rate this runbook">
                <div style={{ display: 'flex', gap: '4px' }}>
                  {emojiRatings.map(r => (
                    <button key={r.value} type="button" onClick={() => setRating(r.value)}
                      style={{ flex: 1, padding: '8px 2px', border: rating === r.value ? '3px solid #0972D3' : '2px solid #D1D5DB',
                        borderRadius: '8px', backgroundColor: rating === r.value ? '#F0F8FF' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px' }}>{r.emoji}</div>
                      <div style={{ fontSize: '10px', fontWeight: 600 }}>{r.label}</div>
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Comments">
                <Textarea value={comments} onChange={({ detail }) => setComments(detail.value)} placeholder="Observations, suggestions..." rows={3} />
              </FormField>
              <FormField label="Photos (optional)">
                <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
              </FormField>
              <Button variant="primary" fullWidth loading={submitting} onClick={handleSubmit} disabled={success}>
                ✅ Submit Report & Complete Task
              </Button>
            </SpaceBetween>
            )}
          </div>
        </Grid>
      )}
    </Modal>
  );
}

// ─── Main Page ───
export default function Calendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statusFilter, setStatusFilter] = useState<any>({ value: 'all', label: 'All Status' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [priorityFilter, setPriorityFilter] = useState<any>({ value: 'all', label: 'All Priority' });
  // Modal states
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [showRunbook, setShowRunbook] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [runbookReadOnly, setRunbookReadOnly] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { loadTasks(); }, []);
  const loadTasks = async () => {
    try { setTasks(await getTasks()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openRunbook = async (task: Task) => {
    if (task.status === 'assigned') await updateTaskStatus(task.taskId, 'in_progress');
    setSelectedTaskId(task.taskId);
    setRunbookReadOnly(false);  // Editable mode when opening normally
    setShowRunbook(true);
  };

  const filtered = tasks
    .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.location.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(t => statusFilter.value === 'all' || t.status === statusFilter.value)
    .filter(t => priorityFilter.value === 'all' || t.priority === priorityFilter.value);

  const { items, collectionProps, paginationProps } = useCollection(filtered, {
    sorting: { defaultState: { sortingColumn: { sortingField: 'scheduledDate' }, isDescending: false } },
    pagination: { pageSize },
  });

  const stats = {
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    upcoming: tasks.filter(t => t.status === 'assigned').length,
    total: tasks.length,
  };

  return (
    <>
      <AppHeader />
      <Container header={<Header variant="h1">🔧 Technician Dashboard</Header>}>
        <SpaceBetween size="l">
          <Container header={<Header variant="h3">📊 Tasks Overview</Header>}>
            <ColumnLayout columns={4} variant="text-grid">
              <div style={{ padding: '16px', backgroundColor: '#DBEAFE', border: '2px solid #93C5FD', borderRadius: '8px', textAlign: 'center' }}>
                <Box fontSize="heading-xl" fontWeight="bold">{stats.total}</Box>
                <Box fontSize="body-s" fontWeight="bold">📋 Total</Box>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#FEF3C7', border: '2px solid #FCD34D', borderRadius: '8px', textAlign: 'center' }}>
                <Box fontSize="heading-xl" fontWeight="bold">{stats.inProgress}</Box>
                <Box fontSize="body-s" fontWeight="bold">🔧 In Progress</Box>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#D1FAE5', border: '2px solid #6EE7B7', borderRadius: '8px', textAlign: 'center' }}>
                <Box fontSize="heading-xl" fontWeight="bold">{stats.completed}</Box>
                <Box fontSize="body-s" fontWeight="bold">✅ Completed</Box>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#EDE9FE', border: '2px solid #C4B5FD', borderRadius: '8px', textAlign: 'center' }}>
                <Box fontSize="heading-xl" fontWeight="bold">{stats.upcoming}</Box>
                <Box fontSize="body-s" fontWeight="bold">📅 Upcoming</Box>
              </div>
            </ColumnLayout>
          </Container>

          <Container header={<Header variant="h3">📋 My Tasks</Header>}>
            <SpaceBetween size="l">
            <SpaceBetween size="s">
              <Input value={searchQuery} onChange={({ detail }) => setSearchQuery(detail.value)} placeholder="Search by title or location..." type="search" />
              <SpaceBetween direction="horizontal" size="xs">
                <Select selectedOption={statusFilter} onChange={({ detail }) => setStatusFilter(detail.selectedOption)}
                  options={[{ value: 'all', label: 'All Status' }, { value: 'assigned', label: 'Assigned' }, { value: 'in_progress', label: 'In Progress' }, { value: 'blocked', label: 'Blocked' }, { value: 'completed', label: 'Completed' }]} />
                <Select selectedOption={priorityFilter} onChange={({ detail }) => setPriorityFilter(detail.selectedOption)}
                  options={[{ value: 'all', label: 'All Priority' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
              </SpaceBetween>
            </SpaceBetween>

            <Table sortingColumn={collectionProps.sortingColumn} sortingDescending={collectionProps.sortingDescending} onSortingChange={collectionProps.onSortingChange} loading={loading}
              columnDefinitions={[
                { id: 'priority', header: 'Priority', width: 100, sortingField: 'priority',
                  cell: (t) => <Badge color={t.priority === 'high' ? 'red' : t.priority === 'medium' ? 'blue' : 'green'}>{t.priority.toUpperCase()}</Badge> },
                { id: 'title', header: 'Task', sortingField: 'title',
                  cell: (t) => <Box><div style={{ fontWeight: 600 }}>{t.title}</div><div style={{ fontSize: '12px', color: '#687078' }}>📍 {t.location} • 📖 {t.runbookId} v{t.runbookVersion}</div></Box> },
                { id: 'schedule', header: 'Schedule', width: 140, sortingField: 'scheduledDate',
                  cell: (t) => <Box><div>{new Date(t.scheduledDate).toLocaleDateString()}</div><div style={{ fontSize: '12px', color: '#687078' }}>{t.estimatedDuration} min</div></Box> },
                { id: 'status', header: 'Status', width: 120, sortingField: 'status',
                  cell: (t) => <StatusIndicator type={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'in-progress' : t.status === 'blocked' ? 'error' : 'pending'}>{t.status.replace('_', ' ')}</StatusIndicator> },
                { id: 'actions', header: 'Actions', width: 180,
                  cell: (t) => <>
                    {(t.status === 'assigned' || t.status === 'blocked') && (
                      <Button variant="primary" onClick={(e) => { e.stopPropagation(); openRunbook(t); }}>Start Task</Button>
                    )}
                    {t.status === 'in_progress' && (
                      <Button variant="primary" onClick={(e) => { e.stopPropagation(); openRunbook(t); }}>📖 Continue</Button>
                    )}
                    {t.status === 'completed' && (
                      <Button onClick={(e) => { e.stopPropagation(); setSelectedTaskId(t.taskId); setShowReport(true); }}>📄 Report</Button>
                    )}
                  </> },
              ]}
              items={items}
              empty={<Box textAlign="center"><b>No tasks found</b></Box>}
              pagination={<Pagination currentPageIndex={paginationProps.currentPageIndex} pagesCount={paginationProps.pagesCount} onChange={paginationProps.onChange} />}
              preferences={<CollectionPreferences title="Preferences" confirmLabel="Confirm" cancelLabel="Cancel" pageSizePreference={{ title: 'Items per page', options: [{ value: 5, label: '5' }, { value: 10, label: '10' }, { value: 20, label: '20' }, { value: 50, label: '50' }] }} preferences={{ pageSize }} onConfirm={({ detail }) => setPageSize(detail.pageSize ?? 10)} />}
              onRowClick={({ detail }) => { setSelectedTaskId(detail.item.taskId); setShowDetail(true); }}
            />
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      </Container>

      {/* Modals */}
      <TaskDetailModal taskId={selectedTaskId} visible={showDetail}
        onDismiss={() => setShowDetail(false)}
        onStart={() => { setShowDetail(false); const t = tasks.find(t => t.taskId === selectedTaskId); if (t) openRunbook(t); }} />
      <RunbookModal taskId={selectedTaskId} visible={showRunbook}
        onDismiss={() => setShowRunbook(false)}
        onComplete={() => { setShowRunbook(false); loadTasks(); }}
        readOnly={runbookReadOnly} />
      <ReportModal taskId={selectedTaskId} visible={showReport}
        onDismiss={() => setShowReport(false)}
        onViewRunbook={() => {
          const task = tasks.find(t => t.taskId === selectedTaskId);
          if (task) {
            setRunbookReadOnly(true);  // Read-only mode when viewing from completed report
            setShowRunbook(true);
          }
        }} />

      <Chatbot />
    </>
  );
}
