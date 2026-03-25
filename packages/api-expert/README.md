# Expert API - AI Analysis Engine

Python Lambda functions for AI-powered analysis of field reports using Amazon Bedrock.

## Architecture

```
EventBridge (hourly) → Step Functions → 3 Lambda Functions
                                            ↓
                                       Bedrock Claude Sonnet 4.5
                                            ↓
                                       DynamoDB (Patterns, Proposals)
```

## Lambda Functions

### 1. ReadReports (`lambdas/read_reports/index.py`)

**Purpose:** List and group field reports from S3

**Input:** EventBridge trigger (hourly)

**Process:**
- List S3 reports from last 7 days
- Parse S3 keys: `reports/{runbook_id}/{YYYY-MM-DD}/{report_id}.md`
- Group reports by runbook ID
- Load runbook metadata from DynamoDB

**Output:**
```json
{
  "procedures": [
    {
      "procedureCode": "PROC-VLV-2024-003",
      "runbookId": "RB-VLV-003",
      "reports": [...],
      "runbook": {...}
    }
  ]
}
```

---

### 2. AnalyzePatterns (`lambdas/analyze_patterns/index.py`)

**Purpose:** Detect recurring patterns using Bedrock AI

**Input:** Procedures with reports from ReadReports

**Process:**
- Load full runbook content from S3
- Call Bedrock Claude Sonnet 4.5 with nuclear-grade prompt
- Detect patterns with 3+ occurrences
- Perform root cause analysis (5-Whys)
- Map to specific runbook steps
- Store patterns in DynamoDB

**Bedrock Configuration:**
- Model: `eu.anthropic.claude-sonnet-4-5-20250929-v1:0`
- Max Tokens: 8000
- Temperature: 0.05 (very precise)

**Prompt Persona:** Dr. Jean-Pierre Moreau (Level 3 Nuclear Safety Inspector)

**Output:**
```json
{
  "patterns": [
    {
      "patternId": "PATTERN-20260128-003-001",
      "type": "safety_critical",
      "affectedSteps": [2],
      "frequency": 9,
      "severity": "critical",
      "description": "...",
      "rootCause": "...",
      "recommendedAction": "..."
    }
  ]
}
```

---

### 3. GenerateSuggestions (`lambdas/generate_suggestions/index.py`)

**Purpose:** Generate precise runbook modifications

**Input:** Patterns from AnalyzePatterns

**Process:**
- For each pattern (skip expert_rejected)
- Load runbook context
- Call Bedrock Claude Sonnet 4.5 with precision prompt
- Generate exact modifications (current → proposed text)
- Specify tool requirements with models and specs
- Calculate time/cost impact
- Store proposals in DynamoDB

**Bedrock Configuration:**
- Model: `eu.anthropic.claude-sonnet-4-5-20250929-v1:0`
- Max Tokens: 4000
- Temperature: 0.1 (precise but slightly creative)

**Prompt Persona:** Marcus (Senior Procedure Expert)

**Output:**
```json
{
  "proposals": [
    {
      "proposalId": "uuid",
      "title": "Add secondary pressure verification to Step 2",
      "stepDetails": {
        "currentInstruction": "...",
        "proposedInstruction": "...",
        "rationale": "..."
      },
      "newToolsRequired": [...],
      "timeAdjustmentMinutes": 5,
      "estimatedCostEuros": 2400
    }
  ]
}
```

---

## DynamoDB Tables

### RunbooksMetadata
- PK: `runbookId`
- GSI: `procedureCode-index`
- Stores: metadata, current version, S3 paths

### Patterns
- PK: `patternId`
- GSI: `procedureCode-severity-index`
- Stores: detected patterns, root causes, evidence
- Rejection tracking: `status`, `rejectedBy`, `rejectionReason`

### Proposals
- PK: `proposalId`
- GSI: `status-createdAt-index`
- Stores: precise modifications, tools, costs, implementation notes

---

## Rejection Feedback Loop

When an expert rejects a proposal:
1. Update pattern status to `expert_rejected`
2. Store rejection reason in pattern record
3. AI workflow skips patterns with `expert_rejected` status
4. Pattern remains for audit trail but won't generate new proposals

---

## Environment Variables

**ReadReports:**
- `REPORTS_BUCKET` - S3 bucket with field reports
- `RUNBOOKS_METADATA_TABLE` - DynamoDB table name

**AnalyzePatterns:**
- `RUNBOOKS_BUCKET` - S3 bucket with runbook content
- `PATTERNS_TABLE` - DynamoDB table name
- `BEDROCK_MODEL_ID` - Bedrock model identifier

**GenerateSuggestions:**
- `RUNBOOKS_BUCKET` - S3 bucket with runbook content
- `PATTERNS_TABLE` - DynamoDB table name
- `PROPOSALS_TABLE` - DynamoDB table name
- `BEDROCK_MODEL_ID` - Bedrock model identifier

---

## IAM Permissions

**ReadReports:**
- `s3:GetObject` on reports bucket
- `dynamodb:GetItem` on runbooks metadata table

**AnalyzePatterns:**
- `s3:GetObject` on runbooks bucket
- `dynamodb:PutItem` on patterns table
- `bedrock:InvokeModel` on Claude Sonnet 4.5

**GenerateSuggestions:**
- `s3:GetObject` on runbooks bucket
- `dynamodb:GetItem` on patterns table
- `dynamodb:PutItem` on proposals table
- `dynamodb:UpdateItem` on patterns table
- `bedrock:InvokeModel` on Claude Sonnet 4.5

---

## Testing

```bash
# Unit tests (TODO)
npm test

# Local invocation (TODO)
sam local invoke ReadReports --event events/hourly-trigger.json
```

---

## Deployment

Deployed via CDK stack: `infrastructure/lib/expert/ai-stack.ts`

```bash
cd infrastructure
cdk deploy ExpertAIStack --context env=dev
```

---

## Monitoring

**CloudWatch Metrics:**
- Lambda invocations, duration, errors
- Bedrock API calls, tokens used
- DynamoDB read/write capacity

**CloudWatch Logs:**
- Lambda execution logs
- Bedrock request/response logs
- Pattern detection results

**Alarms:**
- Lambda errors > threshold
- Bedrock throttling
- DynamoDB capacity exceeded
