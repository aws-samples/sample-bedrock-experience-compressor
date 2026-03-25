# Demo Data for XP Compressor

Realistic field maintenance data across 5 energy sectors.

## Structure

```
demo-data/
├── reports/          # 30 realistic field reports (Jan-Mar 2026)
├── photos/           # 90 AI-generated photos (3 per report)
└── runbooks/         # 10 maintenance runbooks
```

## Content

- **30 reports** from 17 different technicians
- **10 runbooks** across 5 energy sectors (nuclear, wind, solar, thermal, hydro)
- **90 photos** generated with Amazon Bedrock Nova Canvas
- All reports contain realistic technician feedback on runbook quality

## Setup AWS Environment

### One-command setup

```bash
../scripts/setup-from-scratch.py <your-aws-profile>
```

This script automatically:
1. Uploads 10 runbooks to S3 (v3.2)
2. Uploads 30 reports to S3
3. Uploads 90 photos to S3
4. Creates 33 tasks in DynamoDB (30 completed + 3 assigned)
5. Creates 30 reports in DynamoDB
6. Creates 18 Cognito users (one demo user + 17 technicians from reports)

### What you'll get

**S3 Buckets:**
- 10 runbooks at v3.2
- 30 reports organized by runbook/date
- 90 photos organized by date

**DynamoDB:**
- 33 tasks (30 completed, 3 assigned for testing)
- 30 reports with ratings, comments, and photos
- Tasks assigned to actual technicians (not hardcoded)

**Cognito:**
- Demo user for testing workflow
- 17 technician users extracted from reports

### Verification

After setup, verify your data:

```bash
# Count DynamoDB items
aws dynamodb scan --table-name YOUR-TASKS-TABLE --select COUNT --profile YOUR_PROFILE
aws dynamodb scan --table-name YOUR-REPORTS-TABLE --select COUNT --profile YOUR_PROFILE

# Expected results: 33 tasks, 30 reports

# List S3 objects
aws s3 ls s3://YOUR-RUNBOOKS-BUCKET/ --recursive --profile YOUR_PROFILE
aws s3 ls s3://YOUR-REPORTS-BUCKET/ --recursive --profile YOUR_PROFILE

# Expected: 10 runbooks, 30 reports, 90 photos
```

### Optional: Cleanup before setup

The script will prompt you to clean existing data. Answer "y" to remove:
- All tasks and reports from DynamoDB
- All reports, runbooks, and photos from S3

## Regenerate Photos

If you need to regenerate photos (e.g., if corrupted or missing):

```bash
cd ..
python scripts/generate-photos-auto.py
```

Cost: ~$0.04 per photo using Amazon Bedrock Nova Canvas.
