import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

const RUNBOOKS_BUCKET = process.env.RUNBOOKS_BUCKET;
const RUNBOOKS_METADATA_TABLE = process.env.RUNBOOKS_METADATA_TABLE;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map(o => o.trim()).filter(Boolean);

function getCorsHeaders(origin?: string) {
  const headers: Record<string, string> = {
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

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const corsHeaders = getCorsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const runbookId = event.pathParameters?.id;
    if (!runbookId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing runbook ID' }),
      };
    }

    const metadataResponse = await dynamodb.send(
      new GetCommand({ TableName: RUNBOOKS_METADATA_TABLE, Key: { runbookId } })
    );

    if (!metadataResponse.Item) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Runbook not found' }),
      };
    }

    const s3Path = metadataResponse.Item.s3LatestPath || metadataResponse.Item.s3Path;
    if (!s3Path) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No S3 path found for runbook' }),
      };
    }

    const s3Response = await s3.send(
      new GetObjectCommand({ Bucket: RUNBOOKS_BUCKET, Key: s3Path })
    );

    const content = await s3Response.Body?.transformToString();

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/markdown' },
      body: content || '',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting runbook:', message);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get runbook', message }),
    };
  }
};
