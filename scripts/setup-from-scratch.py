#!/usr/bin/env python3
"""
XP Compressor - Complete Setup from Scratch
Single script to populate entire AWS environment with demo data
"""

import sys
import re
import boto3
from pathlib import Path

if len(sys.argv) < 2:
    print("Usage: python3 setup-from-scratch.py <AWS_PROFILE>")
    sys.exit(1)
PROFILE = sys.argv[1]

session = boto3.Session(profile_name=PROFILE)
REGION = session.region_name or "us-east-1"
s3 = session.client('s3')
dynamodb = session.resource('dynamodb', region_name=REGION)
cognito = session.client('cognito-idp')
cf = session.client('cloudformation')


def get_resources():
    """Get all AWS resource IDs from CloudFormation"""
    print("🔍 Getting AWS resource IDs from CloudFormation...")
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
        elif stack['StackName'] == 'XPCompressor-Cognito-dev':
            for output in stack.get('Outputs', []):
                if output['OutputKey'] == 'UserPoolId':
                    resources['user_pool_id'] = output['OutputValue']
        elif stack['StackName'] == 'XPCompressor-Expert-dev':
            for output in stack.get('Outputs', []):
                if output['OutputKey'] == 'RunbooksMetadataTableName':
                    resources['runbooks_metadata_table'] = output['OutputValue']
        elif stack['StackName'] == 'XPCompressor-Manager-dev':
            for output in stack.get('Outputs', []):
                if output['OutputKey'] == 'ReportsIndexTableName':
                    resources['reports_index_table'] = output['OutputValue']
                elif output['OutputKey'] == 'InsightsTableName':
                    resources['insights_table'] = output['OutputValue']

    return resources


def cleanup_all(resources):
    """Optional: Clean all existing data"""
    print("\n🧹 CLEANUP - Remove existing demo data")
    print("=" * 60)

    confirm = input("Clean existing data? (y/N): ").lower()
    if confirm != 'y':
        print("⏭️  Skipping cleanup")
        return

    # Delete all DynamoDB items
    print("🗑️  Deleting reports from DynamoDB...")
    reports_table = dynamodb.Table(resources['reports_table'])
    scan = reports_table.scan(ProjectionExpression='reportId')
    count = 0
    with reports_table.batch_writer() as batch:
        for item in scan['Items']:
            batch.delete_item(Key={'reportId': item['reportId']})
            count += 1
    print(f"  ✅ Deleted {count} reports")

    print("🗑️  Deleting tasks from DynamoDB...")
    tasks_table = dynamodb.Table(resources['tasks_table'])
    scan = tasks_table.scan(ProjectionExpression='taskId')
    count = 0
    with tasks_table.batch_writer() as batch:
        for item in scan['Items']:
            batch.delete_item(Key={'taskId': item['taskId']})
            count += 1
    print(f"  ✅ Deleted {count} tasks")

    # Delete Technicians entries
    if 'technicians_table' in resources:
        print("🗑️  Deleting technicians from DynamoDB...")
        tech_table = dynamodb.Table(resources['technicians_table'])
        scan = tech_table.scan(ProjectionExpression='technicianId')
        count = 0
        with tech_table.batch_writer() as batch:
            for item in scan['Items']:
                batch.delete_item(Key={'technicianId': item['technicianId']})
                count += 1
        print(f"  ✅ Deleted {count} technicians")

    # Delete Manager tables (ReportsIndex + Insights)
    for table_key, table_name, pk, sk in [
        ('reports_index_table', 'ReportsIndex', 'reportId', 'completedAt'),
        ('insights_table', 'Insights', 'insightId', 'createdAt'),
    ]:
        if table_key in resources:
            print(f"🗑️  Deleting items from {table_name}...")
            tbl = dynamodb.Table(resources[table_key])
            scan = tbl.scan(ProjectionExpression=f'{pk}, {sk}')
            count = 0
            with tbl.batch_writer() as batch:
                for item in scan.get('Items', []):
                    batch.delete_item(Key={pk: item[pk], sk: item[sk]})
                    count += 1
            print(f"  ✅ Deleted {count} items")

    # Empty S3 buckets
    for bucket_key, bucket_name in [
        ('reports_bucket', 'Reports'),
        ('runbooks_bucket', 'Runbooks'),
        ('photos_bucket', 'Photos')
    ]:
        print(f"🗑️  Emptying {bucket_name} bucket...")
        try:
            response = s3.list_objects_v2(Bucket=resources[bucket_key])
            if 'Contents' in response:
                objects = [{'Key': obj['Key']} for obj in response['Contents']]
                if objects:
                    s3.delete_objects(Bucket=resources[bucket_key], Delete={'Objects': objects})
                print(f"  ✅ Deleted {len(objects)} objects")
            else:
                print(f"  ✅ Already empty")
        except Exception as e:
            print(f"  ⚠️  Error: {e}")


def parse_runbook_metadata(filepath):
    """Parse runbook markdown file to extract metadata"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract title from first H1 heading
    title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else "Unknown"

    # Extract Procedure Code (try both formats)
    proc_code_match = re.search(r'\*\*Procedure Code:\*\*\s+(.+)', content)
    if not proc_code_match:
        proc_code_match = re.search(r'\*\*Procedure:\*\*\s+(.+)', content)
    procedure_code = proc_code_match.group(1).strip() if proc_code_match else "UNKNOWN"

    # Extract Runbook ID (try explicit field first, then extract from title/filename)
    runbook_id_match = re.search(r'\*\*Runbook ID:\*\*\s+(.+)', content)
    if runbook_id_match:
        runbook_id = runbook_id_match.group(1).strip()
    else:
        # Try to extract from title (e.g., "RB-015: Containment Pressure Test")
        title_id_match = re.search(r'^#\s+(RB-[A-Z0-9-]+):', content, re.MULTILINE)
        if title_id_match:
            runbook_id = title_id_match.group(1).strip()
        else:
            # Fallback: extract from filename
            runbook_id = '-'.join(filepath.stem.split('-')[:2])

    # Extract Version (try both Version and Revision)
    version_match = re.search(r'\*\*Version:\*\*\s+(.+)', content)
    if not version_match:
        version_match = re.search(r'\*\*Revision:\*\*\s+(.+)', content)
    version = version_match.group(1).strip() if version_match else "1.0"

    return {
        'runbookId': runbook_id,
        'procedureCode': procedure_code,
        'title': title,
        'version': version
    }


def get_runbook_versions_from_reports():
    """Scan reports to find all runbook versions needed"""
    reports_dir = Path(__file__).parent.parent / 'demo-data' / 'reports'
    versions_needed = {}  # {runbook_id: set of versions}

    for report_file in reports_dir.glob('2026-*.md'):
        content = report_file.read_text()
        match = re.search(r'\*\*Runbook:\*\*\s+(\S+)\s+v(\S+)', content)
        if match:
            rb_id = match.group(1).strip()
            version = f"v{match.group(2).strip()}"
            if rb_id not in versions_needed:
                versions_needed[rb_id] = set()
            versions_needed[rb_id].add(version)

    return versions_needed


def upload_runbooks(resources):
    """Upload all runbooks to S3 at all versions needed by reports and populate DynamoDB metadata"""
    print("\n📖 STEP 1: Upload Runbooks to S3 + Populate Metadata")
    print("=" * 60)

    # Get all versions needed from reports
    versions_needed = get_runbook_versions_from_reports()
    print(f"Found {len(versions_needed)} runbooks with multiple versions needed")
    print()

    runbooks_dir = Path(__file__).parent.parent / 'demo-data' / 'runbooks'
    runbook_files = list(runbooks_dir.glob('*.md'))

    # Check if RunbooksMetadata table exists
    metadata_table = None
    if 'runbooks_metadata_table' in resources:
        metadata_table = dynamodb.Table(resources['runbooks_metadata_table'])

    uploaded = 0
    metadata_created = 0

    for rb_file in runbook_files:
        # Parse metadata from runbook content
        metadata = parse_runbook_metadata(rb_file)
        rb_id = metadata['runbookId']

        # Upload to all versions needed for this runbook
        versions = versions_needed.get(rb_id, {'v3.2'})  # Default to v3.2 if not found
        for version in versions:
            s3_key = f"{rb_id}/{version}/runbook.md"

            try:
                s3.upload_file(
                    str(rb_file),
                    resources['runbooks_bucket'],
                    s3_key
                )
                print(f"  ✅ {rb_id}/{version}/runbook.md")
                uploaded += 1
            except Exception as e:
                print(f"  ❌ Failed to upload {rb_id}/{version}: {e}")

        # Create metadata entry in DynamoDB (once per runbook, not per version)
        if metadata_table:
            try:
                # Use the latest version as the default path
                latest_version = sorted(versions, reverse=True)[0]
                s3_latest_path = f"{rb_id}/{latest_version}/runbook.md"

                metadata_table.put_item(Item={
                    'runbookId': rb_id,
                    'procedureCode': metadata['procedureCode'],
                    'title': metadata['title'],
                    'version': metadata['version'],
                    's3Bucket': resources['runbooks_bucket'],
                    's3LatestPath': s3_latest_path,  # Path to latest version
                    'createdAt': '2026-01-01T00:00:00Z'
                })
                metadata_created += 1
            except Exception as e:
                print(f"  ⚠️  Failed to create metadata for {rb_id}: {e}")

    print(f"\n✅ Uploaded {uploaded} runbook versions")
    if metadata_table:
        print(f"✅ Created {metadata_created} runbook metadata entries")


def parse_report(filepath):
    """Parse a report markdown file and extract metadata"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract metadata
    report_id_match = re.search(r'\*\*Report ID:\*\*\s+(.+)', content)
    task_id_match = re.search(r'\*\*Task ID:\*\*\s+(.+)', content)
    technician_match = re.search(r'\*\*Technician:\*\*\s+(.+?)\s+\((.+?)\)', content)
    runbook_match = re.search(r'\*\*Runbook:\*\*\s+(\S+)\s+v(\S+)', content)
    location_match = re.search(r'\*\*Location:\*\*\s+(.+)', content)
    date_match = re.search(r'\*\*Date:\*\*\s+(\d{4}-\d{2}-\d{2})', content)
    started_match = re.search(r'- Started:\s+(\d{2}:\d{2})', content)
    completed_match = re.search(r'- Completed:\s+(\d{2}:\d{2})', content)
    duration_match = re.search(r'- Duration:\s+(\d+)\s+minutes\s+\(estimated:\s+(\d+)', content)
    everything_ok_match = re.search(r'- Everything OK:\s+(Yes|No)', content)
    had_delays_match = re.search(r'- Had Delays:\s+(Yes|No)', content)
    rating_match = re.search(r'- Runbook Rating:\s+(\d+)/5', content)
    comments_match = re.search(r'## Comments\n\n(.+?)(?=\n##|\Z)', content, re.DOTALL)

    if not all([report_id_match, runbook_match, date_match]):
        return None

    report_id = report_id_match.group(1).strip()
    task_id = task_id_match.group(1).strip() if task_id_match else f"task-{report_id}"
    runbook_id = runbook_match.group(1).strip()
    runbook_version = f"v{runbook_match.group(2).strip()}"
    date = date_match.group(1).strip()

    technician_name = "Unknown"
    technician_id = "tech-999"
    if technician_match:
        technician_name = technician_match.group(1).strip()
        technician_id = technician_match.group(2).strip()

    started_time = started_match.group(1) if started_match else "08:00"
    completed_time = completed_match.group(1) if completed_match else "16:00"
    actual_duration = int(duration_match.group(1)) if duration_match else 240
    estimated_duration = int(duration_match.group(2)) if duration_match else 240
    everything_ok = everything_ok_match.group(1) == "Yes" if everything_ok_match else False
    had_delays = had_delays_match.group(1) == "Yes" if had_delays_match else False
    rating = int(rating_match.group(1)) if rating_match else 3
    location = location_match.group(1).strip() if location_match else "Unknown"
    comments = comments_match.group(1).strip() if comments_match else ""

    started_at = f"{date}T{started_time}:00Z"
    completed_at = f"{date}T{completed_time}:00Z"

    delay_reason = ""
    if had_delays:
        first_issue_match = re.search(r'- Issue:\s*(.+?)(?:\n-|\n\n)', content, re.DOTALL)
        if first_issue_match:
            delay_reason = first_issue_match.group(1).strip()[:200]

    year, month, day = date.split('-')
    photo_count = len(re.findall(r'!\[.*?\]\(.*/photos/\d{4}/\d{2}/\d{2}/', content))
    photos = [f"{year}/{month}/{day}/{report_id}-photo{i+1}.png" for i in range(photo_count)]

    s3_key = f"{runbook_id}/{date}/{report_id}.md"

    return {
        'report_id': report_id,
        'task_id': task_id,
        'technician_id': technician_id,
        'technician_name': technician_name,
        'runbook_id': runbook_id,
        'runbook_version': runbook_version,
        'location': location,
        'date': date,
        'started_at': started_at,
        'completed_at': completed_at,
        'actual_duration': actual_duration,
        'estimated_duration': estimated_duration,
        'everything_ok': everything_ok,
        'had_delays': had_delays,
        'delay_reason': delay_reason,
        'rating': rating,
        'comments': comments,
        'photos': photos,
        's3_key': s3_key,
        'filepath': filepath
    }


def upload_reports_and_populate(resources):
    """Upload reports + photos to S3 and populate DynamoDB

    Note: Tasks are initially created with original technicianId,
    but will be re-assigned later to demo users.
    """
    print("\n📄 STEP 2: Upload Reports + Photos and Populate DynamoDB")
    print("=" * 60)

    tasks_table = dynamodb.Table(resources['tasks_table'])
    reports_table = dynamodb.Table(resources['reports_table'])

    # Find all reports
    reports_dir = Path(__file__).parent.parent / 'demo-data' / 'reports'
    report_files = sorted([
        f for f in reports_dir.glob('2026-*.md')
    ])

    print(f"Found {len(report_files)} reports\n")

    uploaded_reports = 0
    uploaded_photos = 0
    tasks_created = 0
    reports_created = 0
    technicians = {}

    for filepath in report_files:
        filename = filepath.name
        print(f"📄 {filename}")

        data = parse_report(filepath)
        if not data:
            print(f"  ⚠️  Could not parse")
            continue

        # Track original technicians
        technicians[data['technician_id']] = data['technician_name']

        # Use original technicianId (will be re-assigned later)
        assigned_tech_id = data['technician_id']

        # Upload report to S3
        try:
            s3.upload_file(
                str(filepath),
                resources['reports_bucket'],
                data['s3_key']
            )
            uploaded_reports += 1
            print(f"  ✅ Report uploaded to S3")
        except Exception as e:
            print(f"  ❌ S3 upload failed: {e}")
            continue

        # Upload photos to S3
        photos_dir = Path(__file__).parent.parent / 'demo-data' / 'photos'
        for photo_key in data['photos']:
            photo_path = photos_dir / photo_key
            if photo_path.exists():
                try:
                    s3.upload_file(
                        str(photo_path),
                        resources['photos_bucket'],
                        photo_key
                    )
                    uploaded_photos += 1
                except Exception as e:
                    print(f"    ⚠ Failed to upload photo {photo_key}: {e}")

        # Create task in DynamoDB
        task_data = {
            'taskId': data['task_id'],
            'title': f"{data['runbook_id']} Maintenance",
            'description': f"Maintenance task for {data['location']}",
            'location': data['location'],
            'scheduledDate': data['started_at'],
            'estimatedDuration': data['estimated_duration'],
            'priority': 'medium',
            'status': 'completed',
            'runbookId': data['runbook_id'],
            'runbookVersion': data['runbook_version'],
            'runbookS3Path': f"s3://{resources['runbooks_bucket']}/{data['runbook_id']}/{data['runbook_version']}/",
            'assignedTo': assigned_tech_id,
            'createdBy': 'system',
            'createdAt': data['started_at'],
            'updatedAt': data['completed_at'],
            'startedAt': data['started_at'],
            'completedAt': data['completed_at']
        }

        try:
            response = tasks_table.get_item(Key={'taskId': data['task_id']})
            if 'Item' not in response:
                tasks_table.put_item(Item=task_data)
                tasks_created += 1
                print(f"  ✅ Task created (assigned to {assigned_tech_id})")
            else:
                print(f"  ℹ️  Task already exists: {data['task_id']}")
        except Exception as e:
            print(f"  ⚠️  Task creation failed: {e}")

        # Create report in DynamoDB
        report_data = {
            'reportId': data['report_id'],
            'taskId': data['task_id'],
            'technicianId': data['technician_id'],
            'runbookId': data['runbook_id'],
            'runbookVersion': data['runbook_version'],
            'startedAt': data['started_at'],
            'completedAt': data['completed_at'],
            'actualDuration': data['actual_duration'],
            'everythingOk': data['everything_ok'],
            'hadDelays': data['had_delays'],
            'delayReason': data['delay_reason'],
            'runbookRating': data['rating'],
            'comments': data['comments'],
            's3ReportPath': data['s3_key'],
            'photos': data['photos'],
            'createdAt': data['completed_at']
        }

        try:
            reports_table.put_item(Item=report_data)
            reports_created += 1
            print(f"  ✅ Report created in DynamoDB")
        except Exception as e:
            print(f"  ❌ Report creation failed: {e}")

        print()

    print("=" * 60)
    print(f"✅ Reports uploaded to S3: {uploaded_reports}/{len(report_files)}")
    print(f"✅ Photos uploaded to S3: {uploaded_photos}")
    print(f"✅ Tasks created in DynamoDB: {tasks_created}/{len(report_files)}")
    print(f"✅ Reports created in DynamoDB: {reports_created}/{len(report_files)}")
    print(f"✅ Unique technicians found: {len(technicians)}")

    if tasks_created == 0 and len(report_files) > 0:
        print(f"ℹ️  Note: Tasks may already exist (skipped creation)")

    return technicians


def create_3_assigned_tasks(resources, assigned_to_tech_id='tech-001'):
    """Create 3 high-priority assigned tasks for demo workflow"""
    print("\n📋 STEP 3: Create 3 Assigned Tasks for Demo")
    print("=" * 60)

    tasks_table = dynamodb.Table(resources['tasks_table'])

    demo_tasks = [
        {
            'taskId': 'task-rb001-001',
            'title': 'Primary Pump RCP-A Maintenance',
            'description': 'Scheduled maintenance for primary pump',
            'location': 'Building A, Primary Circuit Room 101',
            'scheduledDate': '2026-04-01T08:00:00Z',
            'estimatedDuration': 240,
            'priority': 'high',
            'status': 'assigned',
            'runbookId': 'RB-001',
            'runbookVersion': 'v3.2',
            'runbookS3Path': f"s3://{resources['runbooks_bucket']}/RB-001/v3.2/",
            'assignedTo': assigned_to_tech_id,
            'createdBy': 'system',
            'createdAt': '2026-03-25T10:00:00Z',
            'updatedAt': '2026-03-25T10:00:00Z'
        },
        {
            'taskId': 'task-vlv003-001',
            'title': 'Valve Replacement - Unit A102',
            'description': 'Replace aging valve in primary circuit',
            'location': 'Building A, Primary Circuit Room 102',
            'scheduledDate': '2026-04-02T08:00:00Z',
            'estimatedDuration': 240,
            'priority': 'high',
            'status': 'assigned',
            'runbookId': 'RB-VLV-003',
            'runbookVersion': 'v3.2',
            'runbookS3Path': f"s3://{resources['runbooks_bucket']}/RB-VLV-003/v3.2/",
            'assignedTo': assigned_to_tech_id,
            'createdBy': 'system',
            'createdAt': '2026-03-25T10:00:00Z',
            'updatedAt': '2026-03-25T10:00:00Z'
        },
        {
            'taskId': 'task-rb015-001',
            'title': 'Containment Pressure Test Q1',
            'description': 'Quarterly containment pressure test',
            'location': 'Building C, Containment Area',
            'scheduledDate': '2026-04-03T08:00:00Z',
            'estimatedDuration': 180,
            'priority': 'high',
            'status': 'assigned',
            'runbookId': 'RB-015',
            'runbookVersion': 'v3.2',
            'runbookS3Path': f"s3://{resources['runbooks_bucket']}/RB-015/v3.2/",
            'assignedTo': assigned_to_tech_id,
            'createdBy': 'system',
            'createdAt': '2026-03-25T10:00:00Z',
            'updatedAt': '2026-03-25T10:00:00Z'
        }
    ]

    created = 0
    for task in demo_tasks:
        try:
            response = tasks_table.get_item(Key={'taskId': task['taskId']})
            if 'Item' not in response:
                tasks_table.put_item(Item=task)
                created += 1
                print(f"  ✅ {task['title']}")
            else:
                print(f"  ℹ️  Task already exists: {task['title']}")
        except Exception as e:
            print(f"  ❌ Failed to create {task['taskId']}: {e}")

    print(f"\n✅ Created {created}/3 demo tasks (assigned to {assigned_to_tech_id})")


def generate_password():
    """Generate a random 12-char password meeting Cognito policy.
    Uses only shell-safe special chars to avoid escaping issues."""
    import secrets
    import string

    # Avoid chars that cause shell-escaping problems: $ ^ ! % &
    safe_specials = '+-_=.~'
    all_chars = string.ascii_letters + string.digits + safe_specials

    password_chars = []
    password_chars.append(secrets.choice(string.ascii_lowercase))
    password_chars.append(secrets.choice(string.ascii_uppercase))
    password_chars.append(secrets.choice(string.digits))
    password_chars.append(secrets.choice(safe_specials))
    password_chars.extend(secrets.choice(all_chars) for _ in range(8))
    secrets.SystemRandom().shuffle(password_chars)
    return ''.join(password_chars)


def create_cognito_user(resources, username, full_name, role, tech_id=None):
    """Create a single Cognito user with the given role.

    Returns:
        dict with username, password, role, tech_id, name on success; None on failure.
    """
    password = generate_password()

    attributes = [
        {'Name': 'email', 'Value': f'{username}@xpcompressor.demo'},
        {'Name': 'email_verified', 'Value': 'true'},
        {'Name': 'custom:role', 'Value': role},
        {'Name': 'name', 'Value': full_name},
    ]
    if tech_id:
        attributes.append({'Name': 'custom:technicianId', 'Value': tech_id})

    try:
        # Delete existing user if present (custom attributes are immutable)
        try:
            cognito.admin_get_user(
                UserPoolId=resources['user_pool_id'],
                Username=username
            )
            cognito.admin_delete_user(
                UserPoolId=resources['user_pool_id'],
                Username=username
            )
            print(f"  🔄 {username} deleted (will recreate)")
        except cognito.exceptions.UserNotFoundException:
            pass

        cognito.admin_create_user(
            UserPoolId=resources['user_pool_id'],
            Username=username,
            UserAttributes=attributes,
            TemporaryPassword=password,
            MessageAction='SUPPRESS'
        )

        cognito.admin_set_user_password(
            UserPoolId=resources['user_pool_id'],
            Username=username,
            Password=password,
            Permanent=True
        )

        print(f"  ✅ {username} ({full_name}) - role={role}" + (f", {tech_id}" if tech_id else ""))
        return {'username': username, 'password': password, 'role': role, 'tech_id': tech_id, 'name': full_name}
    except Exception as e:
        print(f"  ❌ Failed to create {username}: {e}")
        return None


def create_cognito_users(resources, technicians, max_technicians=3):
    """Create Cognito users: 3 technicians + 1 manager + 1 expert + 1 admin

    Args:
        resources: AWS resource IDs
        technicians: Dict of technician_id -> name from reports
        max_technicians: Maximum number of technician users to create
    """
    print(f"\n👥 STEP 4: Create Cognito Users (3 technicians + manager + expert + admin)")
    print("=" * 60)

    technicians_table = dynamodb.Table(resources['technicians_table'])
    credentials = []
    demo_users_tech_ids = []
    used_usernames = set()

    # --- Technician users (from reports) ---
    print("\n  📋 Technicians:")
    tech_count = 0
    for tech_id, full_name in sorted(technicians.items()):
        if tech_count >= max_technicians:
            break

        parts = full_name.split()
        username = f"{parts[0][0]}{parts[-1]}".lower() if len(parts) >= 2 else full_name.lower().replace(' ', '')

        if username in used_usernames:
            print(f"  ⏭️  Skipping {tech_id} ({full_name}) - username '{username}' already used")
            continue
        used_usernames.add(username)

        cred = create_cognito_user(resources, username, full_name, 'technician', tech_id)
        if cred:
            credentials.append(cred)
            demo_users_tech_ids.append(tech_id)
            tech_count += 1

            # Create DynamoDB Technician entry
            technicians_table.put_item(Item={
                'technicianId': tech_id,
                'name': full_name,
                'email': f'{username}@xpcompressor.demo',
                'cognitoUsername': username,
                'status': 'active',
                'createdAt': '2026-01-01T00:00:00Z'
            })

    # --- Manager user (AWS-approved fictitious name) ---
    print("\n  📊 Manager:")
    cred = create_cognito_user(resources, 'mgarcia', 'Maria Garcia', 'manager')
    if cred:
        credentials.append(cred)

    # --- Expert user (AWS-approved fictitious name) ---
    print("\n  🔬 Expert:")
    cred = create_cognito_user(resources, 'psantos', 'Paulo Santos', 'expert')
    if cred:
        credentials.append(cred)

    # --- Admin user (all-role demo access, AWS-approved fictitious name) ---
    print("\n  👑 Admin (demo - all roles):")
    first_tech_id = demo_users_tech_ids[0] if demo_users_tech_ids else 'tech-001'
    cred = create_cognito_user(resources, 'mmajor', 'Mary Major', 'admin', first_tech_id)
    if cred:
        credentials.append(cred)

    print(f"\n✅ Created {len(credentials)} Cognito users")
    print(f"   {tech_count} technicians + 1 manager + 1 expert + 1 admin")
    if demo_users_tech_ids:
        print(f"ℹ️  Technician IDs: {', '.join(demo_users_tech_ids)}")

    # Find admin user for demo login
    admin_cred = next((c for c in credentials if c['role'] == 'admin'), None)

    return admin_cred, credentials, demo_users_tech_ids


def populate_reports_index(resources):
    """Populate ReportsIndex table from Reports table for Manager analysis"""
    print("\n📊 STEP 6: Populate ReportsIndex for Manager Analysis")
    print("=" * 60)

    if 'reports_index_table' not in resources:
        print("  ⚠️  ReportsIndex table not found (Manager stack not deployed?)")
        return

    reports_table = dynamodb.Table(resources['reports_table'])
    index_table = dynamodb.Table(resources['reports_index_table'])

    # Scan all reports
    scan = reports_table.scan()
    reports = scan.get('Items', [])
    while 'LastEvaluatedKey' in scan:
        scan = reports_table.scan(ExclusiveStartKey=scan['LastEvaluatedKey'])
        reports.extend(scan.get('Items', []))

    print(f"  Found {len(reports)} reports in Reports table")

    count = 0
    with index_table.batch_writer() as batch:
        for report in reports:
            batch.put_item(Item={
                'reportId': report['reportId'],
                'completedAt': report.get('completedAt', report.get('createdAt', '')),
                's3Key': report.get('s3ReportPath', ''),
                'createdAt': report.get('createdAt', ''),
                'runbookId': report.get('runbookId', ''),
            })
            count += 1

    print(f"  ✅ Populated {count} entries in ReportsIndex")


def main():
    print("=" * 60)
    print("🚀 XP COMPRESSOR - COMPLETE SETUP FROM SCRATCH")
    print("=" * 60)
    print()
    print("This script will:")
    print("  1. Upload 10 runbooks to S3")
    print("  2. Upload 30 reports + 90 photos to S3")
    print("  3. Create 30 completed tasks + 30 reports in DynamoDB")
    print("  4. Create 6 Cognito users (3 technicians + manager + expert + admin)")
    print("  5. Distribute all tasks among the 3 technician users")
    print("  6. Create 3 assigned tasks for workflow testing")
    print("  7. Populate ReportsIndex for Manager analysis")
    print()

    # Get AWS resources
    resources = get_resources()
    print(f"✅ Reports Bucket: {resources.get('reports_bucket', 'NOT FOUND')}")
    print(f"✅ Runbooks Bucket: {resources.get('runbooks_bucket', 'NOT FOUND')}")
    print(f"✅ Photos Bucket: {resources.get('photos_bucket', 'NOT FOUND')}")
    print(f"✅ Tasks Table: {resources.get('tasks_table', 'NOT FOUND')}")
    print(f"✅ Reports Table: {resources.get('reports_table', 'NOT FOUND')}")
    print(f"✅ User Pool: {resources.get('user_pool_id', 'NOT FOUND')}")
    print(f"✅ ReportsIndex Table: {resources.get('reports_index_table', 'NOT FOUND')}")
    print(f"✅ Insights Table: {resources.get('insights_table', 'NOT FOUND')}")

    # Optional cleanup
    cleanup_all(resources)

    # Step 1: Upload runbooks
    upload_runbooks(resources)

    # Step 2: Upload reports + photos + populate DynamoDB (without user assignment yet)
    technicians = upload_reports_and_populate(resources)

    # Step 3: Create Cognito users (max 3 users)
    demo_user, all_credentials, demo_users_tech_ids = create_cognito_users(resources, technicians, max_technicians=3)

    # Step 4: Re-assign all tasks AND reports to the 3 demo users (round-robin)
    if demo_users_tech_ids:
        print(f"\n🔄 Re-assigning tasks and reports to {len(demo_users_tech_ids)} demo users...")
        tasks_table = dynamodb.Table(resources['tasks_table'])
        reports_table = dynamodb.Table(resources['reports_table'])

        # Get all tasks
        scan = tasks_table.scan()
        tasks = scan['Items']

        # Re-assign tasks round-robin
        for idx, task in enumerate(tasks):
            new_assigned_to = demo_users_tech_ids[idx % len(demo_users_tech_ids)]
            tasks_table.update_item(
                Key={'taskId': task['taskId']},
                UpdateExpression='SET assignedTo = :val',
                ExpressionAttributeValues={':val': new_assigned_to}
            )

        print(f"  ✅ Re-assigned {len(tasks)} tasks to {len(demo_users_tech_ids)} users")

        # Get all reports and re-assign technicianId round-robin
        scan = reports_table.scan()
        reports = scan['Items']
        for idx, report in enumerate(reports):
            new_tech_id = demo_users_tech_ids[idx % len(demo_users_tech_ids)]
            reports_table.update_item(
                Key={'reportId': report['reportId']},
                UpdateExpression='SET technicianId = :val',
                ExpressionAttributeValues={':val': new_tech_id}
            )

        print(f"  ✅ Re-assigned {len(reports)} reports to {len(demo_users_tech_ids)} users")

    # Step 5: Create 3 assigned tasks (assign to first demo user)
    first_tech_id = demo_users_tech_ids[0] if demo_users_tech_ids else 'tech-001'
    create_3_assigned_tasks(resources, first_tech_id)

    # Step 6: Populate ReportsIndex for Manager analysis
    populate_reports_index(resources)

    # Final summary
    print("\n" + "=" * 60)
    print("🎉 SETUP COMPLETE!")
    print("=" * 60)
    print()
    print("📊 What was created:")
    print("  - 10 runbooks in S3")
    print("  - 30 reports in S3")
    print("  - 90 photos in S3")
    print("  - 33 tasks in DynamoDB (30 completed + 3 assigned)")
    print("  - 30 reports in DynamoDB")
    print(f"  - {len(all_credentials)} Cognito users (3 tech + 1 manager + 1 expert + 1 admin)")
    print("  - 30 entries in ReportsIndex (Manager)")
    print("  ℹ️  Trigger AI analysis from the Manager Dashboard (Trigger Analysis button)")
    print()

    if demo_user:
        print("🔑 Admin Demo Login (all roles):")
        print(f"  Username: {demo_user['username']}")
        print(f"  Password: {demo_user['password']}")
        print(f"  Name: {demo_user['name']}")
        print()
        print("📝 All user credentials saved to: ./cognito-users.txt")

        # Save credentials to file
        with open('cognito-users.txt', 'w', encoding='utf-8') as f:
            f.write("XP Compressor - Cognito User Credentials\n")
            f.write("=" * 60 + "\n\n")
            f.write("Admin Demo User (all roles - for demo):\n")
            f.write(f"  Username: {demo_user['username']}\n")
            f.write(f"  Password: {demo_user['password']}\n")
            f.write(f"  Name: {demo_user['name']}\n\n")
            f.write("All Users:\n")
            for cred in all_credentials:
                role_tag = cred['role']
                tech_tag = f", {cred['tech_id']}" if cred.get('tech_id') else ""
                f.write(f"  {cred['username']} [{role_tag}{tech_tag}]: {cred['password']}\n")

    print()
    print("✅ Ready to demo!")


if __name__ == '__main__':
    main()
