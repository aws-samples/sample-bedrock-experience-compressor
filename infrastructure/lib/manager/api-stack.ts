import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface ManagerApiStackProps extends cdk.StackProps {
  reportsTable: dynamodb.Table;
  reportsBucket: s3.Bucket;
  proposalsTable: dynamodb.Table;
  tasksTable: dynamodb.Table;
  techniciansTable: dynamodb.Table;
  patternsTable: dynamodb.Table;
  runbooksMetadataTable: dynamodb.Table;
  runbooksBucketName: string;
  guardrailId: string;
  guardrailVersion: string;
  guardrailArn: string;
  distributionDomainName: string;
}

export class ManagerApiStack extends cdk.Stack {
  public readonly apiFunction: lambda.Function;
  public readonly resetDemoFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ManagerApiStackProps) {
    super(scope, id, props);

    // Create DynamoDB tables for manager
    const reportsIndexTable = new dynamodb.Table(this, 'ReportsIndex', {
      partitionKey: { name: 'reportId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'completedAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    reportsIndexTable.addGlobalSecondaryIndex({
      indexName: 'createdAt-index',
      partitionKey: { name: 'indexPartition', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const insightsTable = new dynamodb.Table(this, 'ManagerInsights', {
      partitionKey: { name: 'insightId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const analysisJobsTable = new dynamodb.Table(this, 'AnalysisJobs', {
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Report Indexer Lambda (triggered by S3)
    const reportIndexer = new lambda.Function(this, 'ReportIndexer', {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset('../packages/api-manager/lambdas/report_indexer'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        REPORTS_INDEX_TABLE: reportsIndexTable.tableName,
        REPORTS_TABLE: props.reportsTable.tableName,
        REPORTS_BUCKET: props.reportsBucket.bucketName,
      },
    });

    reportsIndexTable.grantReadWriteData(reportIndexer);
    props.reportsTable.grantReadData(reportIndexer);
    props.reportsBucket.grantRead(reportIndexer);

    // Analysis Lambda (scheduled)
    const analysisLambda = new lambda.Function(this, 'AnalysisLambda', {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset('../packages/api-manager/lambdas/analysis'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        REPORTS_INDEX_TABLE: reportsIndexTable.tableName,
        MANAGER_INSIGHTS_TABLE: insightsTable.tableName,
        ANALYSIS_JOBS_TABLE: analysisJobsTable.tableName,
        REPORTS_BUCKET: props.reportsBucket.bucketName,
        BEDROCK_GUARDRAIL_ID: props.guardrailId,
        BEDROCK_GUARDRAIL_VERSION: props.guardrailVersion,
      },
    });

    reportsIndexTable.grantReadData(analysisLambda);
    insightsTable.grantReadWriteData(analysisLambda);
    analysisJobsTable.grantReadWriteData(analysisLambda);
    props.reportsBucket.grantRead(analysisLambda);

    // Grant Bedrock access
    analysisLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-5-*`,
        `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
      ],
    }));
    analysisLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:ApplyGuardrail'],
      resources: [props.guardrailArn],
    }));

    // Schedule analysis daily at 2 AM
    const rule = new events.Rule(this, 'AnalysisSchedule', {
      schedule: events.Schedule.cron({ hour: '2', minute: '0' }),
    });
    rule.addTarget(new targets.LambdaFunction(analysisLambda));

    // Manager API Lambda
    this.apiFunction = new lambda.Function(this, 'ManagerApi', {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset('../packages/api-manager/lambdas/api'),
      timeout: cdk.Duration.seconds(30),
      environment: {
        REPORTS_INDEX_TABLE: reportsIndexTable.tableName,
        MANAGER_INSIGHTS_TABLE: insightsTable.tableName,
        ANALYSIS_JOBS_TABLE: analysisJobsTable.tableName,
        REPORTS_BUCKET: props.reportsBucket.bucketName,
        ANALYSIS_LAMBDA_ARN: analysisLambda.functionArn,
        PROPOSALS_TABLE: props.proposalsTable.tableName,
        REPORTS_TABLE: props.reportsTable.tableName,
        TASKS_TABLE: props.tasksTable.tableName,
        TECHNICIANS_TABLE: props.techniciansTable.tableName,
        ALLOWED_ORIGINS: `https://${props.distributionDomainName},http://localhost:3000,http://localhost:5173`,
      },
    });

    reportsIndexTable.grantReadData(this.apiFunction);
    insightsTable.grantReadWriteData(this.apiFunction);
    analysisJobsTable.grantReadData(this.apiFunction);
    props.reportsBucket.grantRead(this.apiFunction);
    props.reportsTable.grantReadData(this.apiFunction);
    analysisLambda.grantInvoke(this.apiFunction);
    props.proposalsTable.grantReadData(this.apiFunction);
    props.tasksTable.grantReadData(this.apiFunction);
    props.techniciansTable.grantReadData(this.apiFunction);

    // Reset Demo Lambda (admin-only — wipes DynamoDB tables and re-seeds)
    this.resetDemoFunction = new lambda.Function(this, 'ResetDemo', {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset('../packages/api-manager/lambdas/reset_demo'),
      timeout: cdk.Duration.minutes(2),
      memorySize: 512,
      description: `Reset demo data — deployed at ${new Date().toISOString()}`,
      environment: {
        TASKS_TABLE: props.tasksTable.tableName,
        REPORTS_TABLE: props.reportsTable.tableName,
        REPORTS_INDEX_TABLE: reportsIndexTable.tableName,
        PROPOSALS_TABLE: props.proposalsTable.tableName,
        PATTERNS_TABLE: props.patternsTable.tableName,
        INSIGHTS_TABLE: insightsTable.tableName,
        RUNBOOKS_METADATA_TABLE: props.runbooksMetadataTable.tableName,
        RUNBOOKS_BUCKET: props.runbooksBucketName,
        ALLOWED_ORIGINS: `https://${props.distributionDomainName},http://localhost:3000,http://localhost:5173`,
      },
    });

    props.tasksTable.grantReadWriteData(this.resetDemoFunction);
    props.reportsTable.grantReadWriteData(this.resetDemoFunction);
    reportsIndexTable.grantReadWriteData(this.resetDemoFunction);
    props.proposalsTable.grantReadWriteData(this.resetDemoFunction);
    props.patternsTable.grantReadWriteData(this.resetDemoFunction);
    insightsTable.grantReadWriteData(this.resetDemoFunction);
    props.runbooksMetadataTable.grantReadWriteData(this.resetDemoFunction);

    // Outputs
    new cdk.CfnOutput(this, 'ReportsIndexTableName', {
      value: reportsIndexTable.tableName,
    });

    new cdk.CfnOutput(this, 'InsightsTableName', {
      value: insightsTable.tableName,
    });
  }
}
