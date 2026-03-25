import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  distributionDomainName: string;

  // Technician
  technicianApiFunction: lambda.Function;

  // Expert
  getProposalsFunction: lambda.IFunction;
  getProposalFunction: lambda.IFunction;
  updateProposalFunction: lambda.IFunction;
  triggerAnalysisFunction: lambda.IFunction;
  getRunbookFunction: lambda.IFunction;

  // Manager
  managerApiFunction: lambda.Function;

  // Admin
  resetDemoFunction: lambda.Function;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Lambda Authorizer
    const authorizerFunction = new NodejsFunction(this, 'AuthorizerFunction', {
      entry: '../packages/api-authorizer/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(10),
      environment: {
        USER_POOL_ID: props.userPool.userPoolId,
        CLIENT_ID: props.userPoolClient.userPoolClientId,
      },
    });

    const authorizer = new apigateway.TokenAuthorizer(this, 'JwtAuthorizer', {
      handler: authorizerFunction,
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    const defaultMethodOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    };

    // Single REST API
    this.api = new apigateway.RestApi(this, 'UnifiedApi', {
      restApiName: 'XP Compressor API',
      description: 'Unified API for all personas (technician, expert, manager)',
      defaultCorsPreflightOptions: {
        allowOrigins: [
          `https://${props.distributionDomainName}`,
          'http://localhost:3000',
          'http://localhost:5173',
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });

    // CORS headers on error responses (must match allowOrigins)
    const corsOrigin = `'https://${props.distributionDomainName}'`;

    this.api.addGatewayResponse('Unauthorized', {
      type: apigateway.ResponseType.UNAUTHORIZED,
      statusCode: '401',
      responseHeaders: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Credentials': "'true'",
      },
    });

    this.api.addGatewayResponse('AccessDenied', {
      type: apigateway.ResponseType.ACCESS_DENIED,
      statusCode: '403',
      responseHeaders: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Credentials': "'true'",
      },
    });

    const apiRoot = this.api.root.addResource('api');

    // ═══════════════════════════════════════
    // Technician: /api/technician/{proxy+}
    // ═══════════════════════════════════════
    const technicianResource = apiRoot.addResource('technician');
    const technicianIntegration = new apigateway.LambdaIntegration(props.technicianApiFunction);

    technicianResource.addMethod('ANY', technicianIntegration, defaultMethodOptions);
    technicianResource.addProxy({
      defaultIntegration: technicianIntegration,
      defaultMethodOptions,
    });

    // ═══════════════════════════════════════
    // Expert: /api/expert/*
    // ═══════════════════════════════════════
    const expertResource = apiRoot.addResource('expert');

    // GET /api/expert/proposals
    const proposals = expertResource.addResource('proposals');
    proposals.addMethod('GET', new apigateway.LambdaIntegration(props.getProposalsFunction), defaultMethodOptions);

    // GET|POST /api/expert/proposals/{id}
    const proposal = proposals.addResource('{id}');
    proposal.addMethod('GET', new apigateway.LambdaIntegration(props.getProposalFunction), defaultMethodOptions);
    proposal.addMethod('POST', new apigateway.LambdaIntegration(props.updateProposalFunction), defaultMethodOptions);

    // POST /api/expert/trigger-analysis
    const triggerAnalysis = expertResource.addResource('trigger-analysis');
    triggerAnalysis.addMethod('POST', new apigateway.LambdaIntegration(props.triggerAnalysisFunction), defaultMethodOptions);

    // GET /api/expert/runbooks/{id}
    const runbooks = expertResource.addResource('runbooks');
    const runbook = runbooks.addResource('{id}');
    runbook.addMethod('GET', new apigateway.LambdaIntegration(props.getRunbookFunction), defaultMethodOptions);

    // ═══════════════════════════════════════
    // Manager: /api/manager/{proxy+}
    // ═══════════════════════════════════════
    const managerResource = apiRoot.addResource('manager');
    const managerIntegration = new apigateway.LambdaIntegration(props.managerApiFunction);

    managerResource.addMethod('ANY', managerIntegration, defaultMethodOptions);
    managerResource.addProxy({
      defaultIntegration: managerIntegration,
      defaultMethodOptions,
    });

    // ═══════════════════════════════════════
    // Admin: /api/admin/*
    // ═══════════════════════════════════════
    const adminResource = apiRoot.addResource('admin');
    const resetDemo = adminResource.addResource('reset-demo');
    resetDemo.addMethod('POST', new apigateway.LambdaIntegration(props.resetDemoFunction), defaultMethodOptions);

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'Unified API Gateway URL',
      exportName: 'XPCompressorApiUrl',
    });
  }
}
