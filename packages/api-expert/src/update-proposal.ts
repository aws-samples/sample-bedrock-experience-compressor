import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const lambdaClient = new LambdaClient({});
const PROPOSALS_TABLE = process.env.PROPOSALS_TABLE!;
const PATTERNS_TABLE = process.env.PATTERNS_TABLE!;
const UPDATE_RUNBOOK_FUNCTION = process.env.UPDATE_RUNBOOK_FUNCTION!;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map(o => o.trim()).filter(Boolean);

function getCorsHeaders(origin?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (ALLOWED_ORIGINS.length) {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0];
  }
  return headers;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const headers = getCorsHeaders(origin);

  try {
    const proposalId = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');
    const { action, expertName, comments } = body;

    if (!proposalId || !action || !expertName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    if (action !== 'approve' && action !== 'reject') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
    }

    const proposalResult = await dynamodb.send(new GetCommand({
      TableName: PROPOSALS_TABLE,
      Key: { proposalId },
    }));

    if (!proposalResult.Item) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Proposal not found' }) };
    }

    const now = new Date().toISOString();

    await dynamodb.send(new UpdateCommand({
      TableName: PROPOSALS_TABLE,
      Key: { proposalId },
      UpdateExpression: 'SET #status = :status, expertName = :expertName, expertComments = :comments, reviewedAt = :reviewedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': action === 'approve' ? 'approved' : 'rejected',
        ':expertName': expertName,
        ':comments': comments || null,
        ':reviewedAt': now,
      },
    }));

    if (action === 'reject' && proposalResult.Item.patternId) {
      await dynamodb.send(new UpdateCommand({
        TableName: PATTERNS_TABLE,
        Key: { patternId: proposalResult.Item.patternId },
        UpdateExpression: 'SET #status = :status, rejectedBy = :expertName, rejectionReason = :reason, rejectedAt = :rejectedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'expert_rejected',
          ':expertName': expertName,
          ':reason': comments || 'No reason provided',
          ':rejectedAt': now,
        },
      }));
    }

    if (action === 'approve') {
      try {
        await lambdaClient.send(new InvokeCommand({
          FunctionName: UPDATE_RUNBOOK_FUNCTION,
          InvocationType: 'Event',
          Payload: Buffer.from(JSON.stringify({ proposalId })),
        }));
      } catch (invokeError: unknown) {
        const msg = invokeError instanceof Error ? invokeError.message : 'Unknown error';
        console.error('Error triggering runbook update:', msg);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, action, proposalId }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating proposal:', message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to update proposal' }) };
  }
};
