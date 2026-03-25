"""
Live Integration Test for Report Indexer Lambda
Tests against actual AWS infrastructure:
1. Upload a test report to S3
2. Wait for Lambda to process it (triggered by S3 event)
3. Verify the report was indexed in DynamoDB

Prerequisites:
- AWS credentials configured
- Manager stack deployed
- S3 bucket and DynamoDB table exist
"""
import boto3
import time
import sys
from datetime import datetime

# Configuration - update these with your actual resource names
REPORTS_BUCKET = 'xp-compressor-reports-dev'  # Update with actual bucket name
REPORTS_INDEX_TABLE = 'ManagerStack-ReportsIndex'  # Update with actual table name

def upload_test_report(s3_client, bucket_name):
    """Upload a test report to S3"""
    # Generate unique test report
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    report_key = f'RB-001/2026-01-28/report-integration-test-{timestamp}.md'
    report_id = f'report-integration-test-{timestamp}'
    
    report_content = f"""# Integration Test Report

**Report ID:** {report_id}
**Task ID:** test-task-{timestamp}
**Technician:** Integration Test
**Runbook:** RB-001 v1.0
**Location:** Test Environment
**Date:** 2026-01-28

## Timing
- Started: 10:00
- Completed: 11:30
- Duration: 90 minutes (estimated: 90 minutes)

## Status
- Everything OK: Yes
- Had Delays: No
- Runbook Rating: 5/5 stars

## Comments
This is an integration test report to verify the Report Indexer Lambda is working correctly.
Generated at: {datetime.now().isoformat()}

## Test Verification
If you can see this report indexed in DynamoDB, the integration is working!
"""
    
    print(f"📤 Uploading test report to S3...")
    print(f"   Bucket: {bucket_name}")
    print(f"   Key: {report_key}")
    print(f"   Report ID: {report_id}")
    
    try:
        s3_client.put_object(
            Bucket=bucket_name,
            Key=report_key,
            Body=report_content.encode('utf-8'),
            ContentType='text/markdown'
        )
        print("✅ Test report uploaded successfully")
        return report_key, report_id
    except Exception as e:
        print(f"❌ Failed to upload test report: {e}")
        sys.exit(1)


def check_dynamodb_index(dynamodb_client, table_name, report_id, max_attempts=10, wait_seconds=3):
    """Check if the report was indexed in DynamoDB"""
    print(f"\n🔍 Checking DynamoDB for indexed report...")
    print(f"   Table: {table_name}")
    print(f"   Report ID: {report_id}")
    print(f"   Will check up to {max_attempts} times (every {wait_seconds} seconds)")
    
    for attempt in range(1, max_attempts + 1):
        print(f"\n   Attempt {attempt}/{max_attempts}...")
        
        try:
            response = dynamodb_client.get_item(
                TableName=table_name,
                Key={'reportId': {'S': report_id}}
            )
            
            if 'Item' in response:
                item = response['Item']
                print("✅ Report found in DynamoDB!")
                print("\n📋 Indexed Report Details:")
                print(f"   Report ID: {item.get('reportId', {}).get('S', 'N/A')}")
                print(f"   S3 Key: {item.get('s3Key', {}).get('S', 'N/A')}")
                print(f"   Created At: {item.get('createdAt', {}).get('S', 'N/A')}")
                print(f"   Runbook ID: {item.get('runbookId', {}).get('S', 'N/A')}")
                return True
            else:
                print(f"   ⏳ Not found yet, waiting {wait_seconds} seconds...")
                if attempt < max_attempts:
                    time.sleep(wait_seconds)
        except Exception as e:
            print(f"   ⚠️  Error checking DynamoDB: {e}")
            if attempt < max_attempts:
                time.sleep(wait_seconds)
    
    print(f"\n❌ Report was NOT found in DynamoDB after {max_attempts} attempts")
    return False


def cleanup_test_report(s3_client, bucket_name, report_key):
    """Delete the test report from S3"""
    print(f"\n🧹 Cleaning up test report...")
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=report_key)
        print("✅ Test report deleted from S3")
    except Exception as e:
        print(f"⚠️  Failed to delete test report: {e}")


def main():
    """Run the live integration test"""
    print("=" * 70)
    print("🧪 LIVE INTEGRATION TEST: Report Indexer Lambda")
    print("=" * 70)
    
    # Initialize AWS clients
    print("\n🔧 Initializing AWS clients...")
    try:
        s3_client = boto3.client('s3')
        dynamodb_client = boto3.client('dynamodb')
        print("✅ AWS clients initialized")
    except Exception as e:
        print(f"❌ Failed to initialize AWS clients: {e}")
        print("   Make sure AWS credentials are configured")
        sys.exit(1)
    
    # Verify bucket exists
    print(f"\n🪣 Verifying S3 bucket exists: {REPORTS_BUCKET}")
    try:
        s3_client.head_bucket(Bucket=REPORTS_BUCKET)
        print("✅ S3 bucket exists")
    except Exception as e:
        print(f"❌ S3 bucket not found: {e}")
        print(f"   Please update REPORTS_BUCKET in this script with your actual bucket name")
        sys.exit(1)
    
    # Verify DynamoDB table exists
    print(f"\n📊 Verifying DynamoDB table exists: {REPORTS_INDEX_TABLE}")
    try:
        dynamodb_client.describe_table(TableName=REPORTS_INDEX_TABLE)
        print("✅ DynamoDB table exists")
    except Exception as e:
        print(f"❌ DynamoDB table not found: {e}")
        print(f"   Please update REPORTS_INDEX_TABLE in this script with your actual table name")
        sys.exit(1)
    
    # Upload test report
    report_key, report_id = upload_test_report(s3_client, REPORTS_BUCKET)
    
    # Check if report was indexed
    success = check_dynamodb_index(dynamodb_client, REPORTS_INDEX_TABLE, report_id)
    
    # Cleanup
    cleanup_test_report(s3_client, REPORTS_BUCKET, report_key)
    
    # Final result
    print("\n" + "=" * 70)
    if success:
        print("✅ INTEGRATION TEST PASSED")
        print("   The Report Indexer Lambda is working correctly!")
        print("   S3 events are triggering the Lambda and reports are being indexed.")
    else:
        print("❌ INTEGRATION TEST FAILED")
        print("   The report was NOT indexed in DynamoDB.")
        print("\n   Possible issues:")
        print("   1. S3 event notification not configured on the bucket")
        print("   2. Lambda function not deployed or has errors")
        print("   3. Lambda doesn't have permissions to write to DynamoDB")
        print("   4. Lambda execution role missing required permissions")
        print("\n   Check CloudWatch Logs for the Lambda function for more details")
        sys.exit(1)
    print("=" * 70)


if __name__ == '__main__':
    main()
