#!/bin/bash
# Helper script to run live integration test
# Automatically fetches stack outputs and runs the test

set -e

echo "🔍 Fetching CloudFormation stack outputs..."

# Get stack name (adjust if your stack has a different name)
STACK_NAME="ManagerStack"

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
    echo "❌ Stack '$STACK_NAME' not found"
    echo "   Please deploy the Manager stack first or update STACK_NAME in this script"
    exit 1
fi

# Get outputs
echo "📊 Getting stack outputs..."
REPORTS_BUCKET=$(aws cloudformation describe-stack-resources \
    --stack-name "$STACK_NAME" \
    --query "StackResources[?ResourceType=='AWS::S3::Bucket' && LogicalResourceId=='ReportsBucket'].PhysicalResourceId" \
    --output text 2>/dev/null || echo "")

REPORTS_INDEX_TABLE=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ReportsIndexTableName'].OutputValue" \
    --output text)

INDEXER_FUNCTION=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ReportIndexerFunctionName'].OutputValue" \
    --output text)

# If reports bucket not found in manager stack, try to find it from shared stack
if [ -z "$REPORTS_BUCKET" ] || [ "$REPORTS_BUCKET" == "None" ]; then
    echo "   Looking for reports bucket in other stacks..."
    REPORTS_BUCKET=$(aws s3 ls | grep "xp-compressor-reports" | awk '{print $3}' | head -1)
fi

echo ""
echo "📋 Found resources:"
echo "   Reports Bucket: $REPORTS_BUCKET"
echo "   ReportsIndex Table: $REPORTS_INDEX_TABLE"
echo "   Indexer Function: $INDEXER_FUNCTION"
echo ""

# Validate we found the resources
if [ -z "$REPORTS_BUCKET" ] || [ "$REPORTS_BUCKET" == "None" ]; then
    echo "❌ Could not find reports S3 bucket"
    echo "   Please check that the bucket exists and update the script"
    exit 1
fi

if [ -z "$REPORTS_INDEX_TABLE" ] || [ "$REPORTS_INDEX_TABLE" == "None" ]; then
    echo "❌ Could not find ReportsIndex DynamoDB table"
    echo "   Please check that the Manager stack is deployed"
    exit 1
fi

# Update the Python test script with actual values
echo "📝 Updating test script with actual resource names..."
sed -i.bak "s/REPORTS_BUCKET = .*/REPORTS_BUCKET = '$REPORTS_BUCKET'/" test_live_integration.py
sed -i.bak "s/REPORTS_INDEX_TABLE = .*/REPORTS_INDEX_TABLE = '$REPORTS_INDEX_TABLE'/" test_live_integration.py
rm test_live_integration.py.bak

echo "✅ Test script updated"
echo ""
echo "🧪 Running live integration test..."
echo ""

# Run the test
python3 test_live_integration.py

exit $?
