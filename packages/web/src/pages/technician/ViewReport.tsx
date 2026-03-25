import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import technicianApi from '../../services/technicianApi';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  Badge,
} from '@cloudscape-design/components';

export default function ViewReport() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadReport(id);
    }
  }, [id]);

  const loadReport = async (taskId: string) => {
    try {
      const response = await technicianApi.get(`/api/technician/reports?taskId=${taskId}`);
      const reportData = response.data.reports[0];
      setReport(reportData);
      
      // Generate presigned URLs for photos
      if (reportData?.photos && reportData.photos.length > 0) {
        const urls = await Promise.all(
          reportData.photos.map(async (photoUrl: string) => {
            const viewResponse = await technicianApi.post('/api/technician/photos/view-url', { photoUrl });
            return viewResponse.data.viewUrl;
          })
        );
        setPhotoUrls(urls);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box>Loading report...</Box>;
  }

  if (!report) {
    return <Box>No report found for this task</Box>;
  }

  return (
    <>
      <AppHeader />
      <Container
        header={<Header variant="h1">Completion Report</Header>}
      >
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Completed At</Box>
              <Box>{new Date(report.completedAt).toLocaleString()}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Duration</Box>
              <Box>{report.actualDuration} minutes</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Everything OK?</Box>
              <Badge color={report.everythingOk ? 'green' : 'red'}>
                {report.everythingOk ? 'YES' : 'NO'}
              </Badge>
            </div>
            <div>
              <Box variant="awsui-key-label">Delays?</Box>
              <Badge color={report.hadDelays ? 'red' : 'green'}>
                {report.hadDelays ? 'YES' : 'NO'}
              </Badge>
            </div>
          </ColumnLayout>

          {report.hadDelays && report.delayReason && (
            <Box>
              <Box variant="h3">Delay Reason</Box>
              <Box>{report.delayReason}</Box>
            </Box>
          )}

          <Box>
            <Box variant="h3">Runbook Rating</Box>
            <Box fontSize="heading-l">
              {'⭐'.repeat(report.runbookRating)} {report.runbookRating}/5
            </Box>
          </Box>

          {report.comments && (
            <Box>
              <Box variant="h3">Comments</Box>
              <Box>{report.comments}</Box>
            </Box>
          )}

          {report.photos && report.photos.length > 0 && (
            <Box>
              <Box variant="h3">Photos ({report.photos.length})</Box>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {photoUrls.map((url: string, idx: number) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                ))}
              </div>
            </Box>
          )}
        </SpaceBetween>
      </Container>
    </>
  );
}
