import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PhotoUpload from '../../components/PhotoUpload';
import AppHeader from '../../components/AppHeader';
import technicianApi from '../../services/technicianApi';
import {
  Container,
  Header,
  Form,
  FormField,
  RadioGroup,
  Textarea,
  Button,
  SpaceBetween,
  Alert,
  Checkbox,
} from '@cloudscape-design/components';

export default function ReportForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [everythingOk, setEverythingOk] = useState('yes');
  const [hadDelays, setHadDelays] = useState('no');
  const [delayReason, setDelayReason] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Pre-fill comments from field notes
  useEffect(() => {
    const saved = localStorage.getItem(`runbook-notes-${id}`);
    if (saved) setComments(saved);
  }, [id]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Issue checkboxes
  const [issueTools, setIssueTools] = useState(false);
  const [issueSteps, setIssueSteps] = useState(false);
  const [issueTime, setIssueTime] = useState(false);
  const [issueSafety, setIssueSafety] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build issues array
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

      // Show success and navigate
      setSuccess(true);
      setTimeout(() => navigate('/technician/calendar'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const emojiRatings = [
    { value: 1, emoji: '😟', label: 'Very Poor' },
    { value: 2, emoji: '😐', label: 'Poor' },
    { value: 3, emoji: '🙂', label: 'Acceptable' },
    { value: 4, emoji: '😊', label: 'Good' },
    { value: 5, emoji: '😃', label: 'Excellent' },
  ];

  return (
    <>
      <AppHeader />
      <Container
      header={
        <Header variant="h1">
          Completion Report
        </Header>
      }
    >
      <form onSubmit={handleSubmit}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate(-1)}>Cancel</Button>
              <Button variant="primary" loading={loading} formAction="submit">
                Submit Report
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="l">
            {error && (
              <Alert type="error" dismissible onDismiss={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert type="success">
                ✅ Report submitted successfully! Redirecting...
              </Alert>
            )}

            <FormField label="1️⃣ Everything OK?">
              <RadioGroup
                value={everythingOk}
                onChange={({ detail }) => setEverythingOk(detail.value)}
                items={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
              />
            </FormField>

            <FormField label="2️⃣ Any delays?">
              <RadioGroup
                value={hadDelays}
                onChange={({ detail }) => setHadDelays(detail.value)}
                items={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
              />
            </FormField>

            {hadDelays === 'yes' && (
              <FormField label="Describe the delay">
                <Textarea
                  value={delayReason}
                  onChange={({ detail }) => setDelayReason(detail.value)}
                  placeholder="What caused the delay?"
                  rows={3}
                />
              </FormField>
            )}

            <FormField label="3️⃣ Issues Encountered">
              <SpaceBetween size="s">
                <Checkbox
                  checked={issueTools}
                  onChange={({ detail }) => setIssueTools(detail.checked)}
                >
                  🔧 Missing tools - Tools listed were not available
                </Checkbox>
                <Checkbox
                  checked={issueSteps}
                  onChange={({ detail }) => setIssueSteps(detail.checked)}
                >
                  📝 Missing steps - Procedure omits necessary steps
                </Checkbox>
                <Checkbox
                  checked={issueTime}
                  onChange={({ detail }) => setIssueTime(detail.checked)}
                >
                  ⏰ Incorrect time estimate - Actual time differs significantly
                </Checkbox>
                <Checkbox
                  checked={issueSafety}
                  onChange={({ detail }) => setIssueSafety(detail.checked)}
                >
                  🛡️ Safety concerns - Risks not mentioned in procedure
                </Checkbox>
              </SpaceBetween>
            </FormField>

            <FormField label="4️⃣ Rate this runbook">
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                {emojiRatings.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRating(r.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: rating === r.value ? '3px solid #0972D3' : '2px solid #D1D5DB',
                      borderRadius: '8px',
                      backgroundColor: rating === r.value ? '#F0F8FF' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '4px' }}>{r.emoji}</div>
                    <div style={{ fontSize: '11px', fontWeight: '600' }}>{r.label}</div>
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="5️⃣ Additional comments (optional)">
              <Textarea
                value={comments}
                onChange={({ detail }) => setComments(detail.value)}
                placeholder="Any observations or suggestions..."
                rows={4}
              />
            </FormField>

            <FormField label="6️⃣ Add photos (optional)">
              <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
            </FormField>
          </SpaceBetween>
        </Form>
      </form>
    </Container>
    </>
  );
}
