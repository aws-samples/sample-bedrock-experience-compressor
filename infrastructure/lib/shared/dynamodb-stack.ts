import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DynamoDBStack extends cdk.Stack {
  public readonly techniciansTable: dynamodb.Table;
  public readonly tasksTable: dynamodb.Table;
  public readonly reportsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.techniciansTable = new dynamodb.Table(this, 'Technicians', {
      partitionKey: { name: 'technicianId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.tasksTable = new dynamodb.Table(this, 'Tasks', {
      partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.tasksTable.addGlobalSecondaryIndex({
      indexName: 'assignedTo-scheduledDate-index',
      partitionKey: { name: 'assignedTo', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'scheduledDate', type: dynamodb.AttributeType.STRING },
    });

    this.reportsTable = new dynamodb.Table(this, 'Reports', {
      partitionKey: { name: 'reportId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.reportsTable.addGlobalSecondaryIndex({
      indexName: 'taskId-index',
      partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
    });

    new cdk.CfnOutput(this, 'TechniciansTableName', { value: this.techniciansTable.tableName });
    new cdk.CfnOutput(this, 'TasksTableName', { value: this.tasksTable.tableName });
    new cdk.CfnOutput(this, 'ReportsTableName', { value: this.reportsTable.tableName });
  }
}
