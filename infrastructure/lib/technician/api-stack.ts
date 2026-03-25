import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TechnicianApiStackProps extends cdk.StackProps {
  techniciansTable: dynamodb.Table;
  tasksTable: dynamodb.Table;
  reportsTable: dynamodb.Table;
  runbooksBucket: s3.Bucket;
  reportsBucket: s3.Bucket;
  photosBucket: s3.Bucket;
  distributionDomainName: string;
}

export class TechnicianApiStack extends cdk.Stack {
  public readonly apiFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: TechnicianApiStackProps) {
    super(scope, id, props);

    this.apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../packages/api-technician/dist'),
      environment: {
        DYNAMODB_TABLE_TECHNICIANS: props.techniciansTable.tableName,
        DYNAMODB_TABLE_TASKS: props.tasksTable.tableName,
        DYNAMODB_TABLE_REPORTS: props.reportsTable.tableName,
        S3_BUCKET_RUNBOOKS: props.runbooksBucket.bucketName,
        S3_BUCKET_REPORTS: props.reportsBucket.bucketName,
        S3_BUCKET_PHOTOS: props.photosBucket.bucketName,
        CORS_ORIGIN: `https://${props.distributionDomainName}`,
        AWS_ACCOUNT_ID: cdk.Stack.of(this).account,
      },
      timeout: cdk.Duration.seconds(30),
    });

    props.techniciansTable.grantReadWriteData(this.apiFunction);
    props.tasksTable.grantReadWriteData(this.apiFunction);
    props.reportsTable.grantReadWriteData(this.apiFunction);
    props.runbooksBucket.grantRead(this.apiFunction);
    props.reportsBucket.grantReadWrite(this.apiFunction);
    props.photosBucket.grantReadWrite(this.apiFunction);
  }
}
