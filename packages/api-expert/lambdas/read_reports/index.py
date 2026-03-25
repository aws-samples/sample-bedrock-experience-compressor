import json
import logging
import os
import boto3
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

REPORTS_BUCKET = os.environ['REPORTS_BUCKET']
RUNBOOKS_METADATA_TABLE = os.environ['RUNBOOKS_METADATA_TABLE']

def lambda_handler(event, context):
    """
    Read reports from S3, group by runbook, load runbook metadata.
    Returns: {procedures: [{procedureCode, runbookId, reports: [...], runbook: {...}}]}
    """
    
    # Get reports from last 30 days (for testing with demo data)
    cutoff_date = datetime.now() - timedelta(days=30)
    logger.info(f"Cutoff date: {cutoff_date}")
    
    # List all reports
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=REPORTS_BUCKET)
    
    reports_by_runbook = defaultdict(list)
    
    for page in pages:
        if 'Contents' not in page:
            logger.warning("No contents in page")
            continue
            
        for obj in page['Contents']:
            key = obj['Key']
            logger.info(f"Processing key: {key}")

            # Parse: {runbook_id}/{YYYY-MM-DD}/{report_id}.md
            parts = key.split('/')
            logger.info(f"Parts: {parts}, len={len(parts)}")
            if len(parts) != 3 or not key.endswith('.md'):
                logger.warning(f"Skipping {key}: parts={len(parts)}, ends with .md={key.endswith('.md')}")
                continue

            runbook_id = parts[0]
            date_str = parts[1]
            logger.info(f"Runbook: {runbook_id}, Date: {date_str}")
            
            # Filter by date
            try:
                report_date = datetime.strptime(date_str, '%Y-%m-%d')
                logger.info(f"Report date: {report_date}, Cutoff: {cutoff_date}, Pass: {report_date >= cutoff_date}")
                if report_date < cutoff_date:
                    logger.warning(f"Skipping old report: {report_date} < {cutoff_date}")
                    continue
            except ValueError as e:
                logger.error(f"Date parse error: {e}")
                continue
            
            # Read report content
            response = s3.get_object(Bucket=REPORTS_BUCKET, Key=key)
            content = response['Body'].read().decode('utf-8')
            
            reports_by_runbook[runbook_id].append({
                'reportId': parts[2].replace('.md', ''),
                'date': date_str,
                'content': content,
                's3Key': key
            })
    
    # Load runbook metadata for each runbook
    table = dynamodb.Table(RUNBOOKS_METADATA_TABLE)
    procedures = []
    
    for runbook_id, reports in reports_by_runbook.items():
        try:
            response = table.get_item(Key={'runbookId': runbook_id})
            if 'Item' in response:
                runbook = response['Item']
                procedures.append({
                    'procedureCode': runbook.get('procedureCode'),
                    'runbookId': runbook_id,
                    'reports': reports,
                    'runbook': runbook
                })
        except Exception as e:
            logger.error(f"Error loading runbook {runbook_id}: {e}")
            continue
    
    return {
        'statusCode': 200,
        'procedures': procedures,
        'totalReports': sum(len(p['reports']) for p in procedures)
    }
