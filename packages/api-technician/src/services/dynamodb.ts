import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
export const dynamodb = DynamoDBDocumentClient.from(client);

export const TABLES = {
  TECHNICIANS: process.env.DYNAMODB_TABLE_TECHNICIANS || 'Technicians',
  TASKS: process.env.DYNAMODB_TABLE_TASKS || 'Tasks',
  REPORTS: process.env.DYNAMODB_TABLE_REPORTS || 'Reports',
};
