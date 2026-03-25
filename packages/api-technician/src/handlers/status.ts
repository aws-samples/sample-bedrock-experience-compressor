import { Router } from 'express';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb, TABLES } from '../services/dynamodb.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// PUT /api/tasks/:id/status - Update task status
router.put('/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['assigned', 'in_progress', 'blocked', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateExpression = ['SET #status = :status', 'updatedAt = :now'];
    const expressionAttributeNames: Record<string, string> = { '#status': 'status' };
    const expressionAttributeValues: Record<string, string> = {
      ':status': status,
      ':now': new Date().toISOString(),
    };

    // Set startedAt when transitioning to in_progress
    if (status === 'in_progress') {
      updateExpression.push('startedAt = if_not_exists(startedAt, :startedAt)');
      expressionAttributeValues[':startedAt'] = new Date().toISOString();
    }

    const command = new UpdateCommand({
      TableName: TABLES.TASKS,
      Key: { taskId: id },
      UpdateExpression: updateExpression.join(', '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await dynamodb.send(command);
    res.json({ task: result.Attributes });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

export default router;
