#!/bin/bash
# Setup QuickSight access to S3 buckets
# Run once per environment after initial deployment

set -e

PROFILE="${AWS_PROFILE:?Set AWS_PROFILE environment variable}"
ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)
QS_ROLE="arn:aws:iam::${ACCOUNT_ID}:role/service-role/aws-quicksight-service-role-v0"

BUCKETS=(
  "xp-compressor-runbooks-${ACCOUNT_ID}"
  "xp-compressor-reports-${ACCOUNT_ID}"
)

POLICY_TEMPLATE='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowQuickSight",
      "Effect": "Allow",
      "Principal": { "AWS": "%s" },
      "Action": [
        "s3:GetObject",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetObjectVersion",
        "s3:ListBucketVersions"
      ],
      "Resource": [
        "arn:aws:s3:::%s",
        "arn:aws:s3:::%s/*"
      ]
    }
  ]
}'

for BUCKET in "${BUCKETS[@]}"; do
  echo "📊 Setting QuickSight policy on s3://${BUCKET}..."
  POLICY=$(printf "$POLICY_TEMPLATE" "$QS_ROLE" "$BUCKET" "$BUCKET")
  aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$POLICY" --profile "$PROFILE"
  echo "✅ Done: ${BUCKET}"
done

echo ""
echo "🎉 QuickSight access configured for all buckets."
