import { Router } from 'express';
import { GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { dynamodb, TABLES } from '../services/dynamodb.js';
import { uploadText, BUCKETS } from '../services/s3.js';
import { generateTextReport } from '../services/report-generator.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/reports?taskId=xxx - Get reports for a task
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.query;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId required' });
    }

    const command = new QueryCommand({
      TableName: TABLES.REPORTS,
      IndexName: 'taskId-index',
      KeyConditionExpression: 'taskId = :taskId',
      ExpressionAttributeValues: {
        ':taskId': taskId,
      },
    });

    const result = await dynamodb.send(command);
    res.json({ reports: result.Items || [] });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/reports - Submit completion report
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      taskId,
      everythingOk,
      hadDelays,
      delayReason,
      runbookRating,
      comments,
      photos = [],
    } = req.body;

    const reportId = `report-${uuidv4()}`;
    const completedAt = new Date();

    // Get task to retrieve startedAt and other info
    const taskCommand = new GetCommand({
      TableName: TABLES.TASKS,
      Key: { taskId },
    });

    const taskResult = await dynamodb.send(taskCommand);
    const task = taskResult.Item;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.startedAt) {
      return res.status(400).json({ error: 'Task was never started' });
    }

    // Auto-calculate duration
    const startedAt = new Date(task.startedAt);
    const actualDuration = Math.round((completedAt.getTime() - startedAt.getTime()) / 60000);

    // Generate text report
    const textReport = generateTextReport({
      reportId,
      taskId,
      taskTitle: task.title,
      location: task.location,
      technicianName: req.user!.name,
      technicianId: req.user!.technicianId,
      runbookId: task.runbookId,
      runbookVersion: task.runbookVersion,
      startedAt: task.startedAt,
      completedAt: completedAt.toISOString(),
      actualDuration,
      estimatedDuration: task.estimatedDuration,
      everythingOk,
      hadDelays,
      delayReason,
      runbookRating,
      comments,
      photos,
    });

    // Upload text report to S3: reports/{runbookId}/{YYYY-MM-DD}/{reportId}.txt
    const dateStr = completedAt.toISOString().split('T')[0];
    const s3Key = `reports/${task.runbookId}/${dateStr}/${reportId}.txt`;

    await uploadText(BUCKETS.REPORTS, s3Key, textReport);

    // Store metadata in DynamoDB
    const reportCommand = new PutCommand({
      TableName: TABLES.REPORTS,
      Item: {
        reportId,
        taskId,
        technicianId: req.user!.technicianId,
        runbookId: task.runbookId,
        runbookVersion: task.runbookVersion,
        startedAt: task.startedAt,
        completedAt: completedAt.toISOString(),
        actualDuration,
        everythingOk,
        hadDelays,
        delayReason,
        runbookRating,
        comments,
        s3ReportPath: s3Key,
        photos,
        createdAt: completedAt.toISOString(),
      },
    });

    await dynamodb.send(reportCommand);

    // Update task status to completed
    const updateCommand = new UpdateCommand({
      TableName: TABLES.TASKS,
      Key: { taskId },
      UpdateExpression: 'SET #status = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':now': completedAt.toISOString(),
      },
    });

    await dynamodb.send(updateCommand);

    res.status(201).json({ reportId, actualDuration });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

export default router;
