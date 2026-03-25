import { CognitoJwtVerifier } from 'aws-jwt-verify';

interface APIGatewayTokenAuthorizerEvent {
  authorizationToken: string;
  methodArn: string;
  type: string;
}

interface AuthorizerResult {
  principalId: string;
  policyDocument: {
    Version: string;
    Statement: Array<{
      Action: string;
      Effect: 'Allow' | 'Deny';
      Resource: string[];
    }>;
  };
  context: Record<string, string>;
}

const ROLE_PATHS: Record<string, string> = {
  technician: '/api/technician',
  expert: '/api/expert',
  manager: '/api/manager',
};

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  clientId: process.env.CLIENT_ID!,
  tokenUse: 'id',
});

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<AuthorizerResult> => {
  const token = event.authorizationToken?.replace('Bearer ', '');
  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const payload = await verifier.verify(token);
    const role = (payload['custom:role'] as string) || '';

    // Extract API Gateway ARN prefix: arn:aws:execute-api:region:account:apiId/stage
    const arnParts = event.methodArn.split('/');
    const arnBase = arnParts.slice(0, 2).join('/');

    const context = {
      role,
      sub: payload.sub,
      email: (payload.email as string) || '',
      givenName: (payload.given_name as string) || '',
      familyName: (payload.family_name as string) || '',
      technicianId: (payload['custom:technicianId'] as string) || '',
    };

    // Admin can access all paths
    if (role === 'admin') {
      return buildPolicy(payload.sub, 'Allow', [`${arnBase}/*/*`], context);
    }

    const allowedPrefix = ROLE_PATHS[role];
    if (!allowedPrefix) {
      return buildPolicy(payload.sub, 'Deny', [event.methodArn], context);
    }

    return buildPolicy(
      payload.sub,
      'Allow',
      [`${arnBase}/*${allowedPrefix}/*`],
      context,
    );
  } catch {
    throw new Error('Unauthorized');
  }
};

function buildPolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resources: string[],
  context: Record<string, string>,
): AuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resources,
        },
      ],
    },
    context,
  };
}
