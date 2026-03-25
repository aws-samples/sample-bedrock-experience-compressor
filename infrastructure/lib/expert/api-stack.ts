import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Duration } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface ExpertApiStackProps extends StackProps {
  reportsBucketName: string;
  runbooksBucketName: string;
  guardrailId: string;
  guardrailVersion: string;
  guardrailArn: string;
  distributionDomainName: string;
}

export class ExpertApiStack extends Stack {
  public readonly runbooksMetadataTable: dynamodb.Table;
  public readonly patternsTable: dynamodb.Table;
  public readonly proposalsTable: dynamodb.Table;
  public readonly getProposalsFunction: NodejsFunction;
  public readonly getProposalFunction: NodejsFunction;
  public readonly updateProposalFunction: NodejsFunction;
  public readonly triggerAnalysisFunction: NodejsFunction;
  public readonly getRunbookFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: ExpertApiStackProps) {
    super(scope, id, props);

    const allowedOrigins = `https://${props.distributionDomainName},http://localhost:3000,http://localhost:5173`;

    // Import shared buckets
    const reportsBucket = s3.Bucket.fromBucketName(this, 'ReportsBucket', props.reportsBucketName);
    const runbooksBucket = s3.Bucket.fromBucketName(this, 'RunbooksBucket', props.runbooksBucketName);

    // Runbooks Metadata Table (matches shared DynamoDB pattern)
    this.runbooksMetadataTable = new dynamodb.Table(this, 'RunbooksMetadata', {
      partitionKey: { name: 'runbookId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.runbooksMetadataTable.addGlobalSecondaryIndex({
      indexName: 'ProcedureCodeIndex',
      partitionKey: { name: 'procedureCode', type: dynamodb.AttributeType.STRING },
    });

    // Patterns Table (matches shared DynamoDB pattern)
    this.patternsTable = new dynamodb.Table(this, 'Patterns', {
      partitionKey: { name: 'patternId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.patternsTable.addGlobalSecondaryIndex({
      indexName: 'ProcedureCodeSeverityIndex',
      partitionKey: { name: 'procedureCode', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'severity', type: dynamodb.AttributeType.STRING },
    });

    // Proposals Table (matches shared DynamoDB pattern)
    this.proposalsTable = new dynamodb.Table(this, 'Proposals', {
      partitionKey: { name: 'proposalId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.proposalsTable.addGlobalSecondaryIndex({
      indexName: 'StatusCreatedAtIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Lambda: Read Reports (matches shared Lambda pattern)
    const readReportsFunction = new lambda.Function(this, 'ReadReports', {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset('../packages/api-expert/lambdas/read_reports'),
      timeout: Duration.minutes(5),
      memorySize: 512,
      reservedConcurrentExecutions: 10,
      environment: {
        REPORTS_BUCKET: props.reportsBucketName,
        RUNBOOKS_METADATA_TABLE: this.runbooksMetadataTable.tableName,
      },
    });

    reportsBucket.grantRead(readReportsFunction);
    this.runbooksMetadataTable.grantReadData(readReportsFunction);

    // Lambda: Analyze Patterns (Bedrock) (matches shared Lambda pattern)
    const analyzePatternsFunction = new lambda.Function(this, 'AnalyzePatterns', {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset('../packages/api-expert/lambdas/analyze_patterns'),
      timeout: Duration.minutes(15),
      memorySize: 1024,
      reservedConcurrentExecutions: 5,
      environment: {
        RUNBOOKS_BUCKET: props.runbooksBucketName,
        PATTERNS_TABLE: this.patternsTable.tableName,
        BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        BEDROCK_GUARDRAIL_ID: props.guardrailId,
        BEDROCK_GUARDRAIL_VERSION: props.guardrailVersion,
      },
    });

    runbooksBucket.grantRead(analyzePatternsFunction);
    this.patternsTable.grantReadWriteData(analyzePatternsFunction);

    analyzePatternsFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-5-*`,
        `arn:aws:bedrock:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:inference-profile/*`,
      ],
    }));
    analyzePatternsFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:ApplyGuardrail'],
      resources: [props.guardrailArn],
    }));

    // Lambda: Generate Suggestions (Bedrock) (matches shared Lambda pattern)
    const generateSuggestionsFunction = new lambda.Function(this, 'GenerateSuggestions', {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset('../packages/api-expert/lambdas/generate_suggestions'),
      timeout: Duration.minutes(15),
      memorySize: 1024,
      reservedConcurrentExecutions: 5,
      environment: {
        RUNBOOKS_BUCKET: props.runbooksBucketName,
        PATTERNS_TABLE: this.patternsTable.tableName,
        PROPOSALS_TABLE: this.proposalsTable.tableName,
        BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        BEDROCK_GUARDRAIL_ID: props.guardrailId,
        BEDROCK_GUARDRAIL_VERSION: props.guardrailVersion,
      },
    });

    runbooksBucket.grantRead(generateSuggestionsFunction);
    this.patternsTable.grantReadWriteData(generateSuggestionsFunction);
    this.proposalsTable.grantReadWriteData(generateSuggestionsFunction);

    generateSuggestionsFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-5-*`,
        `arn:aws:bedrock:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:inference-profile/*`,
      ],
    }));
    generateSuggestionsFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:ApplyGuardrail'],
      resources: [props.guardrailArn],
    }));

    // Lambda: Update Runbook (applies approved proposals)
    const updateRunbookFunction = new lambda.Function(this, 'UpdateRunbook', {
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromAsset('../packages/api-expert/lambdas/update_runbook'),
      timeout: Duration.minutes(5),
      memorySize: 1024,
      reservedConcurrentExecutions: 2,
      environment: {
        RUNBOOKS_BUCKET: props.runbooksBucketName,
        RUNBOOKS_METADATA_TABLE: this.runbooksMetadataTable.tableName,
        PROPOSALS_TABLE: this.proposalsTable.tableName,
        PATTERNS_TABLE: this.patternsTable.tableName,
        BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        BEDROCK_GUARDRAIL_ID: props.guardrailId,
        BEDROCK_GUARDRAIL_VERSION: props.guardrailVersion,
      },
    });

    runbooksBucket.grantReadWrite(updateRunbookFunction);
    this.runbooksMetadataTable.grantReadWriteData(updateRunbookFunction);
    this.proposalsTable.grantReadWriteData(updateRunbookFunction);
    this.patternsTable.grantReadWriteData(updateRunbookFunction);

    updateRunbookFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-5-*`,
        `arn:aws:bedrock:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:inference-profile/*`,
      ],
    }));
    updateRunbookFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:ApplyGuardrail'],
      resources: [props.guardrailArn],
    }));

    // Step Functions Workflow

    // Step Functions Workflow
    const readReportsTask = new tasks.LambdaInvoke(this, 'ReadReportsTask', {
      lambdaFunction: readReportsFunction,
      outputPath: '$.Payload',
    });

    const analyzePatternsTask = new tasks.LambdaInvoke(this, 'AnalyzePatternsTask', {
      lambdaFunction: analyzePatternsFunction,
      outputPath: '$.Payload',
    });

    const generateSuggestionsTask = new tasks.LambdaInvoke(this, 'GenerateSuggestionsTask', {
      lambdaFunction: generateSuggestionsFunction,
      outputPath: '$.Payload',
    });

    const definition = readReportsTask
      .next(analyzePatternsTask)
      .next(generateSuggestionsTask);

    const stateMachineLogGroup = new logs.LogGroup(this, 'StateMachineLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const stateMachine = new sfn.StateMachine(this, 'AnalysisWorkflow', {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: Duration.minutes(30),
      logs: {
        destination: stateMachineLogGroup,
        level: sfn.LogLevel.ALL,
      },
    });

    // EventBridge Rule (daily trigger at 2 AM)
    new events.Rule(this, 'DailyAnalysis', {
      schedule: events.Schedule.cron({ hour: '2', minute: '0' }),
      targets: [new targets.SfnStateMachine(stateMachine)],
    });

    // Outputs
    new CfnOutput(this, 'RunbooksMetadataTableName', {
      value: this.runbooksMetadataTable.tableName,
      exportName: 'ExpertRunbooksMetadataTable',
    });

    new CfnOutput(this, 'PatternsTableName', {
      value: this.patternsTable.tableName,
      exportName: 'ExpertPatternsTable',
    });

    new CfnOutput(this, 'ProposalsTableName', {
      value: this.proposalsTable.tableName,
      exportName: 'ExpertProposalsTable',
    });

    new CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      exportName: 'ExpertAnalysisWorkflowArn',
    });

    // ========== Lambda Functions for API (exposed for unified API Gateway) ==========

    this.getProposalsFunction = new NodejsFunction(this, 'GetProposals', {
      entry: '../packages/api-expert/src/get-proposals.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      environment: {
        PROPOSALS_TABLE: this.proposalsTable.tableName,
        ALLOWED_ORIGINS: allowedOrigins,
      },
    });

    this.getProposalFunction = new NodejsFunction(this, 'GetProposal', {
      entry: '../packages/api-expert/src/get-proposal.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      environment: {
        PROPOSALS_TABLE: this.proposalsTable.tableName,
        ALLOWED_ORIGINS: allowedOrigins,
      },
    });

    this.updateProposalFunction = new NodejsFunction(this, 'UpdateProposal', {
      entry: '../packages/api-expert/src/update-proposal.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      environment: {
        PROPOSALS_TABLE: this.proposalsTable.tableName,
        PATTERNS_TABLE: this.patternsTable.tableName,
        UPDATE_RUNBOOK_FUNCTION: updateRunbookFunction.functionName,
        ALLOWED_ORIGINS: allowedOrigins,
      },
    });

    this.triggerAnalysisFunction = new NodejsFunction(this, 'TriggerAnalysis', {
      entry: '../packages/api-expert/src/trigger-analysis.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      environment: {
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
        ALLOWED_ORIGINS: allowedOrigins,
      },
    });

    this.getRunbookFunction = new NodejsFunction(this, 'GetRunbook', {
      entry: '../packages/api-expert/src/get-runbook.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      environment: {
        RUNBOOKS_BUCKET: props.runbooksBucketName,
        RUNBOOKS_METADATA_TABLE: this.runbooksMetadataTable.tableName,
        ALLOWED_ORIGINS: allowedOrigins,
      },
    });

    // Grant permissions
    this.proposalsTable.grantReadData(this.getProposalsFunction);
    this.proposalsTable.grantReadData(this.getProposalFunction);
    this.proposalsTable.grantReadWriteData(this.updateProposalFunction);
    this.patternsTable.grantReadWriteData(this.updateProposalFunction);
    updateRunbookFunction.grantInvoke(this.updateProposalFunction);
    stateMachine.grantStartExecution(this.triggerAnalysisFunction);
    runbooksBucket.grantRead(this.getRunbookFunction);
    this.runbooksMetadataTable.grantReadData(this.getRunbookFunction);
  }
}
