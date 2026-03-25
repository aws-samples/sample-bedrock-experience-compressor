# Technician API

Backend API for technician operations (Node.js/Express Lambda).

## Features
- Task management (read, update status)
- Report submission (DynamoDB + S3)
- Photo upload (S3 presigned URLs)
- Runbook access (S3 presigned URLs)

## Tech Stack
- Node.js 20 + Express + TypeScript
- AWS SDK v3 (DynamoDB, S3)
- Cognito JWT verification (middleware)

## Development
```bash
npm install
npm run dev
```

## Deployment
Deployed via CDK stack: `infrastructure/lib/technician/api-stack.ts`
