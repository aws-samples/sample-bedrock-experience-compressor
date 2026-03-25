import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QuickSightClient, GenerateEmbedUrlForRegisteredUserCommand } from '@aws-sdk/client-quicksight';

const quicksight = new QuickSightClient({ region: process.env.AWS_REGION || 'us-east-1' });

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',').map(o => o.trim()).filter(Boolean);

function getCorsHeaders(origin?: string) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
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
  const headers = getCorsHeaders(origin);

  try {
    const userArn = event.requestContext.authorizer?.claims?.sub;

    if (!userArn) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const accountId = process.env.AWS_ACCOUNT_ID;
    const quickSuitePath = process.env.QUICKSUITE_INITIAL_PATH || '/start/chatagents/8187ad89-c026-4c1d-8fb6-4af3d315b011';
    const allowedDomains = (process.env.QUICKSIGHT_ALLOWED_DOMAINS || 'http://localhost:3000').split(',').map(d => d.trim()).filter(Boolean);

    if (!accountId) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'AWS_ACCOUNT_ID not configured' }) };
    }

    const command = new GenerateEmbedUrlForRegisteredUserCommand({
      AwsAccountId: accountId,
      ExperienceConfiguration: {
        QuickSightConsole: { InitialPath: quickSuitePath },
      },
      UserArn: `arn:aws:quicksight:us-east-1:${accountId}:user/default/${userArn}`,
      SessionLifetimeInMinutes: 600,
      AllowedDomains: allowedDomains,
    });

    const response = await quicksight.send(command);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedUrl: response.EmbedUrl }),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating QuickSight embed URL:', message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate embed URL', details: message }),
    };
  }
};
