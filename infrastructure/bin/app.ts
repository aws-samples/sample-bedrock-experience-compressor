#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/shared/cognito-stack';
import { DynamoDBStack } from '../lib/shared/dynamodb-stack';
import { S3Stack } from '../lib/shared/s3-stack';
import { FrontendStack } from '../lib/technician/frontend-stack';
import { TechnicianApiStack } from '../lib/technician/api-stack';
import { ExpertApiStack } from '../lib/expert/api-stack';
import { ManagerApiStack } from '../lib/manager/api-stack';
import { BedrockGuardrailStack } from '../lib/shared/bedrock-guardrail-stack';
import { ApiStack } from '../lib/shared/api-stack';

const app = new cdk.App();
const env = app.node.tryGetContext('env') || 'dev';

// Tag all stacks for traceability
cdk.Tags.of(app).add('Project', 'XPCompressor');
cdk.Tags.of(app).add('Environment', env);
cdk.Tags.of(app).add('Owner', 'energy-utilities-france');
cdk.Tags.of(app).add('ManagedBy', 'cdk');

const stackEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const cognitoStack = new CognitoStack(app, `XPCompressor-Cognito-${env}`, { env: stackEnv });
const dynamodbStack = new DynamoDBStack(app, `XPCompressor-DynamoDB-${env}`, { env: stackEnv });
const s3Stack = new S3Stack(app, `XPCompressor-S3-${env}`, { env: stackEnv });
const guardrailStack = new BedrockGuardrailStack(app, `XPCompressor-Guardrail-${env}`, { env: stackEnv });

const frontendStack = new FrontendStack(app, `XPCompressor-Web-${env}`, { env: stackEnv });

const technicianApi = new TechnicianApiStack(app, `XPCompressor-Technician-Api-${env}`, {
  env: stackEnv,
  techniciansTable: dynamodbStack.techniciansTable,
  tasksTable: dynamodbStack.tasksTable,
  reportsTable: dynamodbStack.reportsTable,
  runbooksBucket: s3Stack.runbooksBucket,
  reportsBucket: s3Stack.reportsBucket,
  photosBucket: s3Stack.photosBucket,
  distributionDomainName: frontendStack.distribution.distributionDomainName,
});

// Expert API Stack (Lambdas + DynamoDB + Step Functions, no API Gateway)
const expertApiStack = new ExpertApiStack(app, `XPCompressor-Expert-${env}`, {
  env: stackEnv,
  reportsBucketName: s3Stack.reportsBucket.bucketName,
  runbooksBucketName: s3Stack.runbooksBucket.bucketName,
  guardrailId: guardrailStack.guardrailId,
  guardrailVersion: guardrailStack.guardrailVersion,
  guardrailArn: guardrailStack.guardrailArn,
  distributionDomainName: frontendStack.distribution.distributionDomainName,
});
expertApiStack.addDependency(s3Stack);
expertApiStack.addDependency(frontendStack);
expertApiStack.addDependency(guardrailStack);

// Manager API Stack (Lambdas + DynamoDB + EventBridge, no API Gateway)
const managerApi = new ManagerApiStack(app, `XPCompressor-Manager-${env}`, {
  env: stackEnv,
  reportsTable: dynamodbStack.reportsTable,
  reportsBucket: s3Stack.reportsBucket,
  proposalsTable: expertApiStack.proposalsTable,
  patternsTable: expertApiStack.patternsTable,
  runbooksMetadataTable: expertApiStack.runbooksMetadataTable,
  runbooksBucketName: s3Stack.runbooksBucket.bucketName,
  tasksTable: dynamodbStack.tasksTable,
  techniciansTable: dynamodbStack.techniciansTable,
  guardrailId: guardrailStack.guardrailId,
  guardrailVersion: guardrailStack.guardrailVersion,
  guardrailArn: guardrailStack.guardrailArn,
  distributionDomainName: frontendStack.distribution.distributionDomainName,
});
managerApi.addDependency(dynamodbStack);
managerApi.addDependency(frontendStack);
managerApi.addDependency(s3Stack);
managerApi.addDependency(expertApiStack);
managerApi.addDependency(guardrailStack);

// Unified API Gateway
const apiStack = new ApiStack(app, `XPCompressor-Api-${env}`, {
  env: stackEnv,
  userPool: cognitoStack.userPool,
  userPoolClient: cognitoStack.appClient,
  distributionDomainName: frontendStack.distribution.distributionDomainName,

  // Technician
  technicianApiFunction: technicianApi.apiFunction,

  // Expert
  getProposalsFunction: expertApiStack.getProposalsFunction,
  getProposalFunction: expertApiStack.getProposalFunction,
  updateProposalFunction: expertApiStack.updateProposalFunction,
  triggerAnalysisFunction: expertApiStack.triggerAnalysisFunction,
  getRunbookFunction: expertApiStack.getRunbookFunction,

  // Manager
  managerApiFunction: managerApi.apiFunction,

  // Admin
  resetDemoFunction: managerApi.resetDemoFunction,
});
apiStack.addDependency(cognitoStack);
apiStack.addDependency(frontendStack);
apiStack.addDependency(technicianApi);
apiStack.addDependency(expertApiStack);
apiStack.addDependency(managerApi);
