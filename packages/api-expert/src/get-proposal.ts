import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const PROPOSALS_TABLE = process.env.PROPOSALS_TABLE!;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map(o => o.trim()).filter(Boolean);

function getCorsHeaders(origin?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
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

    if (!proposalId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Proposal ID required' }) };
    }

    const result = await dynamodb.send(new GetCommand({
      TableName: PROPOSALS_TABLE,
      Key: { proposalId },
    }));

    if (!result.Item) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Proposal not found' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching proposal:', message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch proposal' }) };
  }
};
