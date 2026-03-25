# QuickSuite S3 Integration

## Overview

QuickSuite S3 integration creates knowledge bases from documents in S3 buckets, enabling AI-powered Q&A over field reports and runbooks.

## S3 Buckets

| Bucket | Content | QuickSuite Use |
|--------|---------|----------------|
| `xp-compressor-runbooks-{account}` | Maintenance procedures (runbooks) | Knowledge base for procedure lookup |
| `xp-compressor-reports-{account}` | Field technician reports (.md, .txt) | Knowledge base for incident analysis |

## Setup Steps

### 1. Authorize S3 buckets in QuickSuite console (required)

QuickSuite manages the IAM role permissions automatically via this step.

1. **QuickSuite** → Profile (upper right) → **Manage QuickSuite**
2. **Security & permissions** → **Manage** (under "QuickSuite access to AWS services")
3. **Amazon S3** → **Select S3 buckets**
4. Check both buckets → **Update**

### 2. (Optional) Add bucket policies for cross-account access

Only needed if accessing buckets from a different AWS account:

```bash
./scripts/setup-quicksight.sh
```

This script applies bucket policies allowing the QuickSuite service role (`aws-quicksight-service-role-v0`) to read from both buckets.

### 3. Create S3 integration

1. QuickSuite console → **Integrations** → **Add** (+)
2. Choose **Default Account**
3. Enter the S3 bucket URL
4. Select files/folders for the knowledge base
5. Click **Create**

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "You do not have permissions to access the S3 bucket" | Do step 1 — authorize buckets in QuickSuite console first |
| Cross-region error | Bucket must be in same region as QuickSuite (us-east-1) |
| Bucket not in approved list | Ask admin to add bucket in QuickSuite console |

## Agent Embedding

The XPC Assistant agent is embedded as an iframe in all 3 persona pages (Technician, Expert, Manager).

### Prerequisites

1. **Add CloudFront domain to allowed domains:**
   - QuickSuite console → **Manage QuickSuite** → **Domains and Embedding**
   - Add your CloudFront distribution URL
   - Save

2. **Users must be signed in to QuickSuite** in their browser for the 1-click embed to work.

### Agent Details

| Field | Value |
|-------|-------|
| Agent ID | `<AGENT_ID>` |
| Account | `<AWS_ACCOUNT_ID>` |
| Directory alias | `xp-compressor` |
| Embed URL | `https://us-east-1.quicksight.aws.amazon.com/sn/account/xp-compressor/embed/share/accounts/<AWS_ACCOUNT_ID>/chatagents/<AGENT_ID>?directory_alias=xp-compressor` |

> Replace `<AGENT_ID>` and `<AWS_ACCOUNT_ID>` with values from QuickSuite console.

### Seamless embedding (future)

For embedding without requiring separate QuickSuite login, use the Embedding SDK with `GenerateEmbedUrlForRegisteredUser` API. See [Embedding with APIs](https://docs.aws.amazon.com/quicksuite/latest/userguide/embedded-analytics-api.html).

## References

- [QuickSuite S3 Integration](https://docs.aws.amazon.com/quicksuite/latest/userguide/s3-integration.html)
- [Troubleshoot S3 Connection](https://docs.aws.amazon.com/quicksuite/latest/userguide/troubleshoot-connect-S3.html)
