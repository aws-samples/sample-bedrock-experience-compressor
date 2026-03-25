import { Router } from 'express';
import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TABLES } from '../services/dynamodb.js';
import { getPresignedUrl, BUCKETS } from '../services/s3.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/tasks - List tasks for technician
router.get('/', async (req: AuthRequest, res) => {
  try {
    const technicianId = req.user?.technicianId;
    
    if (!technicianId) {
      return res.status(400).json({ error: 'Technician ID not found in token' });
    }

    const command = new QueryCommand({
      TableName: TABLES.TASKS,
      IndexName: 'assignedTo-scheduledDate-index',
      KeyConditionExpression: 'assignedTo = :techId',
      ExpressionAttributeValues: {
        ':techId': technicianId,
      },
    });

    const result = await dynamodb.send(command);
    res.json({ tasks: result.Items || [] });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get task details with runbook URLs
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const command = new GetCommand({
      TableName: TABLES.TASKS,
      Key: {
        taskId: id,
      },
    });

    const result = await dynamodb.send(command);
    const task = result.Item;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Generate presigned URL for runbook markdown
    const runbookPath = task.runbookS3Path.replace('s3://' + BUCKETS.RUNBOOKS + '/', '');
    const markdownUrl = await getPresignedUrl(
      BUCKETS.RUNBOOKS,
      `${runbookPath}runbook.md`
    );

    res.json({
      ...task,
      runbook: {
        markdownUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

export default router;
