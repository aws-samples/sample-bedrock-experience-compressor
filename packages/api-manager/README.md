# Manager API

Backend API for manager operations (Python Lambda).

## Features
- Operational insights (AI-generated from field reports)
- Runbook metrics and team performance analytics
- Report metrics and monthly planning
- AI analysis engine (Bedrock Claude Sonnet 4.5)
- Report indexer (S3 event trigger)

## Tech Stack
- Python 3.x + AWS Lambda
- boto3 (DynamoDB, S3, Bedrock)
- Cognito JWT verification (via API Gateway authorizer)

## Lambda Functions
- **API handler** (`lambdas/api/`) — Main REST API (~900 LOC)
- **Analysis engine** (`lambdas/analysis/`) — Bedrock AI analysis (320 LOC)
- **Report indexer** (`lambdas/report_indexer/`) — S3 event processor (105 LOC)

## Deployment
Deployed via CDK stack: `infrastructure/lib/manager/api-stack.ts`
