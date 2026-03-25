#!/usr/bin/env python3
"""
XP Compressor - Full teardown
Destroys CDK stacks then deletes orphaned resources (S3 buckets, DynamoDB tables, Cognito User Pool).
Run from the project root.

Usage: python3 scripts/teardown.py <AWS_PROFILE>
"""

import subprocess
import sys
import boto3

if len(sys.argv) < 2:
    print("Usage: python3 scripts/teardown.py <AWS_PROFILE>")
    sys.exit(1)

PROFILE = sys.argv[1]

session = boto3.Session(profile_name=PROFILE)
REGION = session.region_name or "us-east-1"
sts = session.client("sts")
s3 = session.client("s3")
dynamodb = session.client("dynamodb")
cognito = session.client("cognito-idp")

ACCOUNT = sts.get_caller_identity()["Account"]

print("=" * 60)
print("🧹 XP COMPRESSOR - FULL TEARDOWN")
print("=" * 60)
print(f"  Account: {ACCOUNT}")
print(f"  Region:  {REGION}")
print(f"  Profile: {PROFILE}")
print()

confirm = input("Type 'DESTROY' to confirm: ").strip()
if confirm != "DESTROY":
    print("❌ Cancelled")
    sys.exit(0)

# 1. cdk destroy
print("\n1️⃣  Destroying CDK stacks...")
result = subprocess.run(
    ["npx", "cdk", "destroy", "--all", "--force", "--profile", PROFILE],
    cwd="infrastructure",
)
if result.returncode != 0:
    print("⚠️  cdk destroy returned errors, continuing with orphan cleanup...")

# 2. S3 buckets
print("\n2️⃣  Deleting orphaned S3 buckets...")
buckets = [b["Name"] for b in s3.list_buckets().get("Buckets", [])]
targets = [
    b for b in buckets
    if b.startswith("xp-compressor-") or b.startswith("xpcompressor-web-dev-")
]

for bucket in targets:
    print(f"  🗑️  {bucket}")
    try:
        # Delete current objects
        paginator = s3.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=bucket):
            objects = [{"Key": o["Key"]} for o in page.get("Contents", [])]
            if objects:
                s3.delete_objects(Bucket=bucket, Delete={"Objects": objects})

        # Delete versioned objects and delete markers
        paginator = s3.get_paginator("list_object_versions")
        for page in paginator.paginate(Bucket=bucket):
            objects = [
                {"Key": o["Key"], "VersionId": o["VersionId"]}
                for o in page.get("Versions", []) + page.get("DeleteMarkers", [])
            ]
            if objects:
                s3.delete_objects(Bucket=bucket, Delete={"Objects": objects})

        s3.delete_bucket(Bucket=bucket)
        print(f"  ✅ Deleted")
    except Exception as e:
        print(f"  ⚠️  {e}")

# 3. DynamoDB tables
print("\n3️⃣  Deleting orphaned DynamoDB tables...")
tables = dynamodb.list_tables()["TableNames"]
targets = [t for t in tables if "XPCompressor" in t]

for table in targets:
    print(f"  🗑️  {table}")
    try:
        dynamodb.delete_table(TableName=table)
        print(f"  ✅ Deleted")
    except Exception as e:
        print(f"  ⚠️  {e}")

# 4. Cognito User Pool
print("\n4️⃣  Deleting orphaned Cognito User Pool...")
pools = cognito.list_user_pools(MaxResults=20).get("UserPools", [])
targets = [p for p in pools if "xp-compressor" in p["Name"]]

for pool in targets:
    print(f"  🗑️  {pool['Name']} ({pool['Id']})")
    try:
        cognito.delete_user_pool(UserPoolId=pool["Id"])
        print(f"  ✅ Deleted")
    except Exception as e:
        print(f"  ⚠️  {e}")

print("\n" + "=" * 60)
print("✅ TEARDOWN COMPLETE")
print("=" * 60)
