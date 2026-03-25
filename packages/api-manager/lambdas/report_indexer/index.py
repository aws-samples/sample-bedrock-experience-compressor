"""
Report Indexer Lambda
Triggered by S3 PUT events to index new reports into ReportsIndex DynamoDB table

AWS Lambda Best Practice: Initialize boto3 clients at module level for connection reuse
across warm container invocations. For testing, mock boto3.resource before importing.
"""
import json
import logging
import os
import boto3
from datetime import datetime
from typing import Dict, Any, Optional
from urllib.parse import unquote_plus

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize boto3 client at module level for connection reuse across invocations
# This is AWS Lambda best practice - connections are reused in warm containers
dynamodb = boto3.resource('dynamodb')


def extract_metadata_from_s3_key(s3_key: str) -> Optional[Dict[str, str]]:
    """
    Extract metadata from S3 key path structure.
    Expected format: reports/{runbook_id}/{YYYY-MM-DD}/report-{id}.md
    Example: reports/RB-001/2026-01-28/report-rcp-a-001.md
    """
    try:
        parts = s3_key.split('/')
        if len(parts) < 4:
            return None
        
        # Skip "reports/" prefix
        if parts[0] != 'reports':
            return None
            
        runbook_id = parts[1]
        date_str = parts[2]
        filename = parts[3]
        
        # Extract report ID from filename (remove .md extension)
        report_id = filename.replace('.md', '')
        
        # Parse date and convert to ISO timestamp
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        created_at = date_obj.isoformat()
        
        return {
            'report_id': report_id,
            's3_key': s3_key,
            'created_at': created_at,
            'runbook_id': runbook_id,
        }
    except Exception as e:
        logger.error(f"Error extracting metadata from S3 key {s3_key}: {str(e)}")
        return None


def write_to_reports_index_table(metadata: Dict[str, str]) -> None:
    """Write report metadata to ReportsIndex DynamoDB table"""
    try:
        table = dynamodb.Table(os.environ['REPORTS_INDEX_TABLE'])
        table.put_item(
            Item={
                'reportId': metadata['report_id'],
                's3Key': metadata['s3_key'],
                'createdAt': metadata['created_at'],
                'runbookId': metadata['runbook_id'],
                'indexPartition': 'ALL',
            }
        )
        logger.info(f"Successfully indexed report: {metadata['report_id']}")
    except Exception as e:
        logger.error(f"Error writing to DynamoDB: {str(e)}")
        raise


def lambda_handler(event: Dict[str, Any], context: Any) -> None:
    """
    Lambda handler for S3 PUT events
    Extracts metadata from S3 key and writes to ReportsIndex table
    """
    logger.info("Processing %d S3 records", len(event.get('Records', [])))
    
    try:
        # Process each S3 record
        for record in event.get('Records', []):
            # Get S3 bucket and key
            s3_info = record.get('s3', {})
            bucket = s3_info.get('bucket', {}).get('name')
            key = unquote_plus(s3_info.get('object', {}).get('key', ''))

            logger.info(f"Processing S3 object: s3://{bucket}/{key}")
            
            # Extract metadata from S3 key
            metadata = extract_metadata_from_s3_key(key)
            if not metadata:
                logger.warning(f"Skipping invalid S3 key format: {key}")
                continue
            
            # Write to ReportsIndex table
            write_to_reports_index_table(metadata)

        logger.info("Report indexing completed successfully")

    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        raise
