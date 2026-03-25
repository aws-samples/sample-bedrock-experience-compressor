# Report Indexer Lambda

S3-triggered Lambda function that indexes field reports into DynamoDB for efficient date-based queries.

## Overview

When a field report is uploaded to S3, this Lambda function:
1. Extracts metadata from the S3 key (`{runbook_id}/{YYYY-MM-DD}/report-{id}.md`)
2. Writes the metadata to the ReportsIndex DynamoDB table
3. Enables the Analysis Lambda to efficiently query reports by date range

## Testing

### Unit Tests

Run unit tests with mocked AWS services:

```bash
python3 -m unittest test_index.py -v
```

All core functionality is tested:
- Metadata extraction from S3 keys
- DynamoDB write operations
- Error handling
- Lambda handler logic

### Live Integration Test

Test against actual AWS infrastructure to verify the complete flow:

```bash
# Automatic (fetches stack outputs automatically)
./run_live_test.sh

# Manual (update resource names in test_live_integration.py first)
python3 test_live_integration.py
```

The live integration test:
1. ✅ Uploads a test report to S3
2. ⏳ Waits for the Lambda to process it (triggered by S3 event)
3. ✅ Verifies the report was indexed in DynamoDB
4. 🧹 Cleans up the test report

**Prerequisites for live test:**
- AWS credentials configured
- Manager stack deployed (`cdk deploy ManagerStack`)
- S3 event notification configured on the reports bucket (see below)

## S3 Event Notification Setup

The Lambda function needs to be triggered by S3 PUT events. This must be configured manually:

### Option 1: AWS Console

1. Go to S3 → Your reports bucket → Properties → Event notifications
2. Create event notification:
   - Name: `report-indexer-trigger`
   - Event types: `PUT` (s3:ObjectCreated:Put)
   - Destination: Lambda function
   - Lambda function: Select the ReportIndexer function

### Option 2: AWS CLI

```bash
# Get the Lambda function ARN from stack outputs
FUNCTION_ARN=$(aws cloudformation describe-stacks \
  --stack-name ManagerStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ReportIndexerFunctionArn`].OutputValue' \
  --output text)

# Get the bucket name
BUCKET_NAME="your-reports-bucket-name"

# Create notification configuration
aws s3api put-bucket-notification-configuration \
  --bucket $BUCKET_NAME \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "LambdaFunctionArn": "'$FUNCTION_ARN'",
        "Events": ["s3:ObjectCreated:Put"],
        "Filter": {
          "Key": {
            "FilterRules": [
              {
                "Name": "suffix",
                "Value": ".md"
              }
            ]
          }
        }
      }
    ]
  }'
```

## Implementation Details

### S3 Key Structure

Expected format: `{runbook_id}/{YYYY-MM-DD}/report-{id}.md`

Examples:
- `RB-001/2026-01-28/report-rcp-a-001.md`
- `RB-VLV-003/2026-01-29/report-vlv-003-001.md`

### DynamoDB Schema

**Table:** ReportsIndex

**Primary Key:**
- `reportId` (String) - Partition key

**GSI:** createdAt-index
- `createdAt` (String) - Partition key for date range queries

**Attributes:**
- `reportId`: Report identifier (extracted from filename)
- `s3Key`: Full S3 key path
- `createdAt`: ISO timestamp (extracted from date in path)
- `runbookId`: Runbook identifier (extracted from path)

### Error Handling

- Invalid S3 keys are skipped (logged but don't fail the Lambda)
- DynamoDB write errors are logged and re-raised
- All errors are logged to CloudWatch Logs

## AWS Lambda Best Practices

This implementation follows AWS Lambda best practices:

- ✅ boto3 clients initialized at module level (connection reuse)
- ✅ Environment variables for configuration
- ✅ Comprehensive error handling and logging
- ✅ Idempotent operations (safe to retry)

Reference: [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
