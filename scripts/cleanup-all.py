#!/usr/bin/env python3
"""
Complete cleanup script - removes ALL demo data from AWS
Run this before setup-from-scratch.py to start fresh
"""

import sys
import boto3

if len(sys.argv) < 2:
    print("Usage: python3 cleanup-all.py <AWS_PROFILE>")
    sys.exit(1)
PROFILE = sys.argv[1]

session = boto3.Session(profile_name=PROFILE)
REGION = session.region_name or "us-east-1"
dynamodb = session.resource('dynamodb', region_name=REGION)
s3 = session.client('s3')
cognito = session.client('cognito-idp')
cf = session.client('cloudformation')


def get_resources():
    """Get all AWS resource IDs from CloudFormation"""
    print("🔍 Getting AWS resource IDs...")
    stacks = cf.describe_stacks()
    resources = {}

    for stack in stacks['Stacks']:
        if stack['StackName'] == 'XPCompressor-S3-dev':
            for output in stack.get('Outputs', []):
                if output['OutputKey'] == 'ReportsBucketName':
                    resources['reports_bucket'] = output['OutputValue']
                elif output['OutputKey'] == 'RunbooksBucketName':
                    resources['runbooks_bucket'] = output['OutputValue']
                elif output['OutputKey'] == 'PhotosBucketName':
                    resources['photos_bucket'] = output['OutputValue']
        elif stack['StackName'] == 'XPCompressor-DynamoDB-dev':
            for output in stack.get('Outputs', []):
                if output['OutputKey'] == 'TasksTableName':
                    resources['tasks_table'] = output['OutputValue']
                elif output['OutputKey'] == 'ReportsTableName':
                    resources['reports_table'] = output['OutputValue']
                elif output['OutputKey'] == 'TechniciansTableName':
                    resources['technicians_table'] = output['OutputValue']
        elif stack['StackName'] == 'XPCompressor-Expert-dev':
            for output in stack.get('Outputs', []):
                if output['OutputKey'] == 'ProposalsTableName':
                    resources['proposals_table'] = output['OutputValue']
                elif output['OutputKey'] == 'PatternsTableName':
                    resources['patterns_table'] = output['OutputValue']
                elif output['OutputKey'] == 'RunbooksMetadataTableName':
                    resources['runbooks_metadata_table'] = output['OutputValue']
        elif stack['StackName'] == 'XPCompressor-Manager-dev':
            for output in stack.get('Outputs', []):
                if output['OutputKey'] == 'InsightsTableName':
                    resources['insights_table'] = output['OutputValue']
                elif output['OutputKey'] == 'ReportsIndexTableName':
                    resources['reports_index_table'] = output['OutputValue']
        elif stack['StackName'] == 'XPCompressor-Cognito-dev':
            for output in stack.get('Outputs', []):
                if output['OutputKey'] == 'UserPoolId':
                    resources['user_pool_id'] = output['OutputValue']

    return resources


def delete_all_items(table_name, key_name):
    """Delete all items from a DynamoDB table (with pagination)"""
    table = dynamodb.Table(table_name)
    count = 0

    # Handle pagination with LastEvaluatedKey
    scan_kwargs = {}

    while True:
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])

        # Delete items in batches
        with table.batch_writer() as batch:
            for item in items:
                if key_name in item:
                    batch.delete_item(Key={key_name: item[key_name]})
                    count += 1

        # Check if there are more pages
        if 'LastEvaluatedKey' not in response:
            break

        scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']

    return count


def empty_s3_bucket(bucket_name):
    """Delete all objects from an S3 bucket"""
    try:
        response = s3.list_objects_v2(Bucket=bucket_name)
        if 'Contents' not in response:
            return 0

        objects = [{'Key': obj['Key']} for obj in response['Contents']]
        if objects:
            s3.delete_objects(Bucket=bucket_name, Delete={'Objects': objects})

        return len(objects)
    except Exception as e:
        print(f"    ⚠️  Error: {e}")
        return 0


def delete_cognito_users(user_pool_id):
    """Delete all users from Cognito user pool"""
    try:
        response = cognito.list_users(UserPoolId=user_pool_id)
        count = 0

        for user in response.get('Users', []):
            username = user['Username']
            try:
                cognito.admin_delete_user(UserPoolId=user_pool_id, Username=username)
                count += 1
                print(f"    ✅ Deleted user: {username}")
            except Exception as e:
                print(f"    ⚠️  Failed to delete {username}: {e}")

        return count
    except Exception as e:
        print(f"    ⚠️  Error listing users: {e}")
        return 0


def main():
    print("=" * 60)
    print("🧹 XP COMPRESSOR - COMPLETE CLEANUP")
    print("=" * 60)
    print()
    print("⚠️  This will DELETE ALL demo data:")
    print("  - All tasks, reports, technicians from DynamoDB")
    print("  - All proposals, patterns, insights from Expert/Manager tables")
    print("  - All runbooks, reports, and photos from S3")
    print("  - All Cognito users")
    print()

    confirm = input("Type 'DELETE' to confirm: ").strip()
    if confirm != 'DELETE':
        print("❌ Cancelled")
        return

    print()
    print("🚀 Starting cleanup...")
    print()

    resources = get_resources()

    # 1. Delete DynamoDB items
    print("1️⃣ Cleaning DynamoDB Tables")
    print("-" * 60)

    # Base tables
    if 'reports_table' in resources:
        count = delete_all_items(resources['reports_table'], 'reportId')
        print(f"  ✅ Reports table: {count} items deleted")

    if 'tasks_table' in resources:
        count = delete_all_items(resources['tasks_table'], 'taskId')
        print(f"  ✅ Tasks table: {count} items deleted")

    if 'technicians_table' in resources:
        count = delete_all_items(resources['technicians_table'], 'technicianId')
        print(f"  ✅ Technicians table: {count} items deleted")

    # Expert tables
    if 'proposals_table' in resources:
        count = delete_all_items(resources['proposals_table'], 'proposalId')
        print(f"  ✅ Proposals table: {count} items deleted")

    if 'patterns_table' in resources:
        count = delete_all_items(resources['patterns_table'], 'patternId')
        print(f"  ✅ Patterns table: {count} items deleted")

    if 'runbooks_metadata_table' in resources:
        count = delete_all_items(resources['runbooks_metadata_table'], 'runbookId')
        print(f"  ✅ RunbooksMetadata table: {count} items deleted")

    # Manager tables
    if 'insights_table' in resources:
        count = delete_all_items(resources['insights_table'], 'insightId')
        print(f"  ✅ ManagerInsights table: {count} items deleted")

    if 'reports_index_table' in resources:
        count = delete_all_items(resources['reports_index_table'], 'reportId')
        print(f"  ✅ ReportsIndex table: {count} items deleted")

    print()

    # 2. Empty S3 buckets
    print("2️⃣ Emptying S3 Buckets")
    print("-" * 60)

    if 'runbooks_bucket' in resources:
        count = empty_s3_bucket(resources['runbooks_bucket'])
        print(f"  ✅ Runbooks bucket: {count} objects deleted")

    if 'reports_bucket' in resources:
        count = empty_s3_bucket(resources['reports_bucket'])
        print(f"  ✅ Reports bucket: {count} objects deleted")

    if 'photos_bucket' in resources:
        count = empty_s3_bucket(resources['photos_bucket'])
        print(f"  ✅ Photos bucket: {count} objects deleted")

    print()

    # 3. Delete Cognito users
    print("3️⃣ Deleting Cognito Users")
    print("-" * 60)

    if 'user_pool_id' in resources:
        count = delete_cognito_users(resources['user_pool_id'])
        print(f"  ✅ Total users deleted: {count}")

    print()
    print("=" * 60)
    print("✅ CLEANUP COMPLETE!")
    print("=" * 60)
    print()
    print("Ready to run setup-from-scratch.py")


if __name__ == '__main__':
    main()
