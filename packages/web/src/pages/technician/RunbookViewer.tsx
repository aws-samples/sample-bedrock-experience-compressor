import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getIdToken } from '../../services/auth';
import AppHeader from '../../components/AppHeader';
import PhotoUpload from '../../components/PhotoUpload';
import technicianApi from '../../services/technicianApi';
import {
  Container, Header, Box, Button, SpaceBetween, Textarea, Grid, Alert,
  FormField, RadioGroup, Checkbox,
} from '@cloudscape-design/components';

export default function RunbookViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Report form state
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
    if (id) loadRunbook(id);
  }, [id]);

  const loadRunbook = async (taskId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/technician/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${getIdToken()}` },
      });
      if (!response.ok) { setError(`Failed to load task: ${response.status}`); return; }
      const data = await response.json();
      if (data.runbook?.markdownUrl) {
        const mdResponse = await fetch(data.runbook.markdownUrl);
        if (!mdResponse.ok) { setError(`Failed to load runbook: ${mdResponse.status}`); return; }
        setMarkdown(await mdResponse.text());
      } else {
        setError('No runbook URL found for this task');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const issues = [];
      if (issueTools) issues.push('Missing tools');
      if (issueSteps) issues.push('Missing steps');
      if (issueTime) issues.push('Incorrect time estimate');
      if (issueSafety) issues.push('Safety concerns');
      await technicianApi.post('/api/technician/reports', {
        taskId: id,
        everythingOk: everythingOk === 'yes',
        hadDelays: hadDelays === 'yes',
        delayReason: hadDelays === 'yes' ? delayReason : undefined,
        runbookRating: rating,
        comments: issues.length > 0 ? `Issues: ${issues.join(', ')}\n\n${comments}` : comments,
        photos,
      });
      setSuccess(true);
      setTimeout(() => navigate('/technician/calendar'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setSubmitError(error.response?.data?.error || error.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const emojiRatings = [
    { value: 1, emoji: '😟', label: 'Poor' },
    { value: 2, emoji: '😐', label: 'Fair' },
    { value: 3, emoji: '🙂', label: 'OK' },
    { value: 4, emoji: '😊', label: 'Good' },
    { value: 5, emoji: '😃', label: 'Great' },
  ];

  if (loading) return <><AppHeader /><Box padding="l">Loading runbook...</Box></>;

  return (
    <>
      <AppHeader />
      <div style={{ padding: '16px' }}>
        <SpaceBetween size="s">
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => navigate('/technician/calendar')}>← My Tasks</Button>
            <Button onClick={() => navigate(`/technician/tasks/${id}`)}>📋 Task Detail</Button>
          </SpaceBetween>

          {error ? (
            <Alert type="error">{error}</Alert>
          ) : (
            <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
              <Container header={<Header variant="h2">📖 Runbook</Header>}>
                <div style={{ maxHeight: '78vh', overflowY: 'auto', padding: '0 8px' }}>
                  <ReactMarkdown>{markdown}</ReactMarkdown>
                </div>
              </Container>

              <Container header={<Header variant="h2">📝 Completion Report</Header>}>
                <div style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                  <SpaceBetween size="m">
                    {success && <Alert type="success">✅ Report submitted! Redirecting...</Alert>}
                    {submitError && <Alert type="error" dismissible onDismiss={() => setSubmitError('')}>{submitError}</Alert>}

                    <FormField label="Everything OK?">
                      <RadioGroup value={everythingOk} onChange={({ detail }) => setEverythingOk(detail.value)}
                        items={[{ value: 'yes', label: '👍 Yes' }, { value: 'no', label: '👎 No' }]} />
                    </FormField>

                    <FormField label="Any delays?">
                      <RadioGroup value={hadDelays} onChange={({ detail }) => setHadDelays(detail.value)}
                        items={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
                    </FormField>
                    {hadDelays === 'yes' && (
                      <Textarea value={delayReason} onChange={({ detail }) => setDelayReason(detail.value)}
                        placeholder="What caused the delay?" rows={2} />
                    )}

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
                        {emojiRatings.map((r) => (
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
                      <Textarea value={comments} onChange={({ detail }) => setComments(detail.value)}
                        placeholder="Observations, suggestions..." rows={4} />
                    </FormField>

                    <FormField label="Photos (optional)">
                      <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
                    </FormField>

                    <Button variant="primary" fullWidth loading={submitting} onClick={handleSubmit}>
                      ✅ Submit Report & Complete Task
                    </Button>
                  </SpaceBetween>
                </div>
              </Container>
            </Grid>
          )}
        </SpaceBetween>
      </div>
    </>
  );
}
