import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, updateTaskStatus } from '../../services/tasks';
import { Task } from '@xp-compressor/shared';
import AppHeader from '../../components/AppHeader';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  ColumnLayout,
} from '@cloudscape-design/components';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadTask(id);
    }
  }, [id]);

  const loadTask = async (taskId: string) => {
    try {
      const data = await getTask(taskId);
      setTask(data);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!task) {
    return <Box>Task not found</Box>;
  }

  return (
    <>
      <AppHeader />
      <Container
      header={
        <Header
          variant="h1"
          actions={
            <Button onClick={() => navigate('/technician/calendar')}>
              ← My Tasks
            </Button>
          }
        >
          {task.title}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <ColumnLayout columns={2} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Location</Box>
            <Box>{task.location}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Priority</Box>
            <Box>{task.priority.toUpperCase()}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Scheduled</Box>
            <Box>{new Date(task.scheduledDate).toLocaleString()}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Duration</Box>
            <Box>{task.estimatedDuration} minutes</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Runbook</Box>
            <Box>{task.runbookId} v{task.runbookVersion}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Status</Box>
            <Box>{task.status.replace('_', ' ').toUpperCase()}</Box>
          </div>
        </ColumnLayout>

        <Box>
          <Box variant="h3">Description</Box>
          <Box>{task.description}</Box>
        </Box>

        <SpaceBetween direction="horizontal" size="s">
          {task.status === 'assigned' && (
            <Button 
              variant="primary"
              onClick={async () => {
                await updateTaskStatus(task.taskId, 'in_progress');
                navigate(`/technician/tasks/${task.taskId}/runbook`);
              }}
            >
              ▶ Start Task & View Runbook
            </Button>
          )}
          {task.status === 'in_progress' && (
            <>
              <Button 
                variant="primary"
                onClick={() => navigate(`/technician/tasks/${task.taskId}/runbook`)}
              >
                📖 View Runbook
              </Button>
              <Button 
                onClick={() => navigate(`/technician/tasks/${task.taskId}/complete`)}
              >
                ✅ Complete & Submit Report
              </Button>
            </>
          )}
          {task.status === 'completed' && (
            <Button onClick={() => navigate(`/technician/tasks/${task.taskId}/report`)}>
              📄 View Report
            </Button>
          )}
        </SpaceBetween>
      </SpaceBetween>
    </Container>
    </>
  );
}
