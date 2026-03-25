# XP Compressor - Setup Scripts

## Available Scripts

### `cleanup-all.py`

Complete cleanup script that removes ALL demo data from AWS.

**Usage:**
```bash
./scripts/cleanup-all.py <your-aws-profile>
```

**What it deletes:**
- All tasks and reports from DynamoDB
- All runbooks, reports, and photos from S3
- All Cognito users

**Safety:** Requires typing "DELETE" to confirm.

---

### `setup-from-scratch.py`

Complete setup script that populates your AWS environment with demo data in one command.

**Usage:**
```bash
./scripts/setup-from-scratch.py <your-aws-profile>
```

**What it does:**
1. Uploads 10 runbooks to S3 (v3.2)
2. Uploads 30 field reports to S3
3. Uploads 90 photos to S3
4. Creates 33 tasks in DynamoDB (30 completed + 3 assigned)
5. Creates 30 reports in DynamoDB
6. Creates Cognito users for all technicians (random passwords)

**Prerequisites:**
- AWS CLI configured with appropriate profile
- Deployed XP Compressor CDK stacks:
  - `XPCompressor-S3-dev`
  - `XPCompressor-DynamoDB-dev`
  - `XPCompressor-Cognito-dev`

**Optional cleanup:**
The script will prompt you to clean existing data before setup. Answer "y" to remove all tasks, reports, and S3 objects.

**Output:**
- Demo user credentials (first technician from reports)
- All user credentials saved to `cognito-users.txt` (gitignored)

---

### `setup-quicksight.sh`

Amazon Quick Suite (ex-QuickSight) S3 integration setup. Configures S3 bucket access for the embedded chat agent's knowledge bases. See [`docs/quicksuite-s3-integration.md`](../docs/quicksuite-s3-integration.md) for full setup documentation.

---

### `generate-photos-auto.py`

Regenerate photos for demo reports using Amazon Bedrock Nova Canvas.

**Usage:**
```bash
./scripts/generate-photos-auto.py
```

**Options:**
1. Generate for ALL reports (~90 photos, ~$3.60)
2. Generate for NEW reports only (Feb-Mar 2026)
3. Generate for specific date range
4. Dry run (preview without generating)

**Prerequisites:**
- AWS credentials configured
- Access to Amazon Bedrock Nova Canvas model
- Demo reports in `../demo-data/reports/`

**Output:**
Photos saved to `../demo-data/photos/{YYYY}/{MM}/{DD}/`

---

## Demo Data

All demo data is located in `../demo-data/`:
- **30 reports** from 17 technicians
- **10 runbooks** across 5 energy sectors
- **90 photos** (3 per report)

See `../demo-data/README.md` for details.

## Verification

After running setup, verify:

```bash
# Count DynamoDB items
aws dynamodb scan --table-name YOUR-TASKS-TABLE --select COUNT --profile YOUR-PROFILE
aws dynamodb scan --table-name YOUR-REPORTS-TABLE --select COUNT --profile YOUR-PROFILE

# Expected: 33 tasks, 30 reports

# Count S3 objects
aws s3 ls s3://YOUR-RUNBOOKS-BUCKET/ --recursive | wc -l
aws s3 ls s3://YOUR-REPORTS-BUCKET/ --recursive | wc -l
aws s3 ls s3://YOUR-PHOTOS-BUCKET/ --recursive | wc -l

# Expected: 10 runbooks, 30 reports, 90 photos
```

## Troubleshooting

### "CloudFormation stack not found"
Make sure your CDK stacks are deployed:
```bash
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --profile YOUR-PROFILE | grep XPCompressor
```

### "Access Denied"
Ensure your AWS profile has permissions for:
- S3: `PutObject`, `ListBucket`
- DynamoDB: `PutItem`, `GetItem`, `Scan`, `DeleteItem`
- Cognito: `AdminCreateUser`, `AdminSetUserPassword`, `AdminGetUser`
- CloudFormation: `DescribeStacks`

### Want to start fresh
Re-run the script and answer "y" to the cleanup prompt. This will remove all existing demo data before re-populating.
