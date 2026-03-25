"""
Analysis Lambda - Simple version
Analyzes reports and generates operational insights using Bedrock
"""
import json
import logging
import os
import hashlib
import boto3
from datetime import datetime, timedelta, UTC
from typing import Dict, Any, List
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
bedrock_client = boto3.client('bedrock-runtime')

# Environment variables
reports_index_table = dynamodb.Table(os.environ['REPORTS_INDEX_TABLE'])
manager_insights_table = dynamodb.Table(os.environ['MANAGER_INSIGHTS_TABLE'])
analysis_jobs_table = dynamodb.Table(os.environ['ANALYSIS_JOBS_TABLE'])
reports_bucket = os.environ['REPORTS_BUCKET']
bedrock_model_id = os.environ.get('BEDROCK_MODEL_ID', 'global.anthropic.claude-sonnet-4-5-20250929-v1:0')
guardrail_id = os.environ.get('BEDROCK_GUARDRAIL_ID')
guardrail_version = os.environ.get('BEDROCK_GUARDRAIL_VERSION')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for scheduled analysis"""
    job_id = str(uuid.uuid4())
    start_time = datetime.now(UTC)
    
    logger.info(f"Starting analysis job {job_id} at {start_time.isoformat()}")
    
    # Create job record
    job_record = {
        'jobId': job_id,
        'startedAt': start_time.isoformat().replace('+00:00', 'Z'),
        'status': 'running',
        'trigger': event.get('trigger', 'scheduled'),
    }
    analysis_jobs_table.put_item(Item=job_record)
    
    try:
        # Get date range (last 90 days by default for manual, 7 days for scheduled)
        end_date = datetime.now(UTC)
        default_days = 90 if event.get('trigger') != 'scheduled' else 7
        start_date = end_date - timedelta(days=default_days)
        
        if 'start_date' in event:
            start_date = datetime.fromisoformat(event['start_date'].replace('Z', '+00:00'))
        if 'end_date' in event:
            end_date = datetime.fromisoformat(event['end_date'].replace('Z', '+00:00'))
        
        logger.info(f"Analyzing reports from {start_date.isoformat()} to {end_date.isoformat()}")
        
        # Step 1: Get reports from DynamoDB
        reports = get_reports_in_range(start_date, end_date)
        if not reports:
            logger.warning("No reports found")
            # Update job as completed
            analysis_jobs_table.update_item(
                Key={'jobId': job_id},
                UpdateExpression='SET #status = :status, completedAt = :completed, reportsAnalyzed = :reports, insightsGenerated = :insights',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'completed',
                    ':completed': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
                    ':reports': 0,
                    ':insights': 0,
                }
            )
            return {'success': True, 'insights_generated': 0, 'reports_analyzed': 0, 'job_id': job_id}
        
        logger.info(f"Found {len(reports)} reports")
        
        # Step 2: Fetch report content from S3
        reports_with_content = []
        for report in reports:
            content = fetch_report_from_s3(report['s3Key'])
            if content:
                reports_with_content.append({
                    'report_id': report['reportId'],
                    'content': content
                })
        
        if not reports_with_content:
            logger.warning("No report content fetched")
            return {'success': True, 'insights_generated': 0, 'reports_analyzed': 0}
        
        logger.info(f"Fetched {len(reports_with_content)} reports")
        
        # Step 3: Analyze with Bedrock
        insights = analyze_with_bedrock(reports_with_content)
        logger.info(f"Generated {len(insights)} insights")
        
        # Step 4: Store insights in DynamoDB
        if insights:
            store_insights(insights)
            logger.info(f"Stored {len(insights)} insights")
        
        # Update job as completed
        analysis_jobs_table.update_item(
            Key={'jobId': job_id},
            UpdateExpression='SET #status = :status, completedAt = :completed, reportsAnalyzed = :reports, insightsGenerated = :insights',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'completed',
                ':completed': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
                ':reports': len(reports_with_content),
                ':insights': len(insights),
            }
        )
        
        return {
            'success': True,
            'job_id': job_id,
            'insights_generated': len(insights),
            'reports_analyzed': len(reports_with_content)
        }
        
    except Exception as e:
        logger.exception(f"Error during analysis job {job_id}: {str(e)}")
        
        # Update job as failed
        analysis_jobs_table.update_item(
            Key={'jobId': job_id},
            UpdateExpression='SET #status = :status, completedAt = :completed, errorMessage = :error',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'failed',
                ':completed': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
                ':error': str(e),
            }
        )
        
        return {
            'success': False,
            'job_id': job_id,
            'error': str(e),
            'insights_generated': 0,
            'reports_analyzed': 0
        }


def get_reports_in_range(start_date: datetime, end_date: datetime) -> List[Dict]:
    """Get reports from DynamoDB in date range"""
    response = reports_index_table.scan()
    reports = response.get('Items', [])
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = reports_index_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        reports.extend(response.get('Items', []))
    
    # Filter by date
    start_iso = start_date.isoformat()
    end_iso = end_date.isoformat()
    
    filtered = [r for r in reports if start_iso <= r.get('createdAt', '') <= end_iso]
    return filtered


def fetch_report_from_s3(s3_key: str) -> str:
    """Fetch report content from S3"""
    try:
        response = s3_client.get_object(Bucket=reports_bucket, Key=s3_key)
        return response['Body'].read().decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to fetch {s3_key}: {str(e)}")
        return None


def analyze_with_bedrock(reports: List[Dict]) -> List[Dict]:
    """Analyze reports with Bedrock and return insights"""
    
    # Build prompt
    reports_text = []
    for report in reports:
        report_id = report['report_id']
        content = report['content']
        reports_text.append(f"=== REPORT ID: {report_id} ===\n{content}\n")
    
    prompt = f"""You are analyzing {len(reports)} field maintenance reports from a nuclear power plant.

Your task: Identify OPERATIONAL MANAGEMENT issues that occur in MULTIPLE reports (at least 2 reports).

CRITICAL DISTINCTION:
You are identifying issues for the OPERATIONS MANAGER, NOT for procedure experts.
The manager can fix operational problems (tools, equipment, staffing, processes).
The manager CANNOT modify runbooks, procedures, or technical documentation - that's handled by a separate expert workflow.

INCLUDE - OPERATIONAL ISSUES (Manager can fix):
- Tool availability: Missing tools, tools not in tool crib, wrong tools provided
- Tool/Equipment calibration: Expired calibration, tools still in circulation past expiry
- Equipment readiness: Dead batteries, broken equipment, equipment not charged
- Consumables: Empty spray cans, missing supplies, insufficient stock
- Process problems: Long queues at warehouse, delays in parts delivery, coordination issues
- Resource problems: Insufficient staffing, scheduling conflicts
- Infrastructure: Badge readers failing, access control issues, facility problems

EXCLUDE - PROCEDURE/DOCUMENTATION ISSUES (Expert workflow handles):
- Runbook modifications: Missing steps, unclear instructions, missing tools from lists
- Form updates: Missing columns, unclear fields, form improvements
- Procedure clarifications: Bolt numbering, reference marks, technical guidance
- Checklist additions: New items to add to pre-work checklists
- Documentation improvements: Photos needed, better explanations

EXAMPLES TO HELP YOU DECIDE:
✅ INCLUDE: "Torque wrenches with expired calibration still in tool crib" → Manager fixes tool management
❌ EXCLUDE: "Bolt numbering unclear on flanges" → Expert updates runbook with clarification
✅ INCLUDE: "Inspection camera batteries dead when needed" → Manager fixes battery charging process
❌ EXCLUDE: "Form BTF-001 lacks columns for torque documentation" → Expert updates form
✅ INCLUDE: "Warehouse understaffed causing 40min queues" → Manager adjusts staffing
❌ EXCLUDE: "Tool calibration check not in Step 1 checklist" → Expert adds to runbook

REPORTS:
{chr(10).join(reports_text)}

OUTPUT FORMAT - Return ONLY valid JSON array:
[
  {{
    "description": "Clear description of the recurring OPERATIONAL issue",
    "category": "Short label (2-4 words max) for charts, e.g. 'Expired calibration', 'Dead batteries', 'Warehouse delays'",
    "issue_type": "tool|equipment|process|resource (tool=portable hand tools & measuring instruments, equipment=machines/systems/devices)",
    "report_ids": ["exact-report-id-1", "exact-report-id-2"],
    "recommended_action": "Specific OPERATIONAL action the manager can take (NOT procedure changes)",
    "frequency": 5
  }}
]

CRITICAL RULES:
1. Use EXACT report IDs from above (e.g., "report-rcp-a-2", "2026-01-25-RCP-A-maintenance-2.md")
2. Only include issues that appear in 2+ reports
3. Set frequency = number of reports mentioning this issue
4. ONLY include operational issues the manager can fix (tools, equipment, staffing, processes)
5. EXCLUDE any issues requiring runbook/procedure/form modifications
6. Do NOT use "documentation" as issue_type - use only: tool, equipment, process, resource
7. Return ONLY the JSON array, no other text
8. If no recurring operational issues found, return []

Begin analysis:"""
    
    # Call Bedrock
    try:
        converse_kwargs = {
            'modelId': bedrock_model_id,
            'messages': [{
                "role": "user",
                "content": [{"text": prompt}]
            }],
            'inferenceConfig': {
                "maxTokens": 4096,
                "temperature": 0.3
            },
        }
        if guardrail_id and guardrail_version:
            converse_kwargs['guardrailConfig'] = {
                'guardrailIdentifier': guardrail_id,
                'guardrailVersion': guardrail_version,
            }
        response = bedrock_client.converse(**converse_kwargs)
        
        ai_response = response['output']['message']['content'][0]['text']
        logger.info(f"Bedrock response: {len(ai_response)} characters")
        
        # Parse JSON
        json_start = ai_response.find('[')
        json_end = ai_response.rfind(']') + 1
        
        if json_start == -1 or json_end == 0:
            logger.warning("No JSON found in response")
            return []
        
        insights_data = json.loads(ai_response[json_start:json_end])
        
        if not isinstance(insights_data, list):
            logger.warning("Response is not a JSON array")
            return []
        
        # Validate insights
        valid_insights = []
        report_ids = {r['report_id'] for r in reports}
        
        for insight in insights_data:
            # Check required fields
            if not all(k in insight for k in ['description', 'issue_type', 'report_ids', 'recommended_action']):
                logger.warning(f"Skipping insight with missing fields")
                continue
            
            # Validate report IDs
            valid_report_ids = [rid for rid in insight['report_ids'] if rid in report_ids]
            if len(valid_report_ids) < 2:
                logger.warning(f"Skipping insight with <2 valid report IDs: {insight['description'][:50]}")
                continue
            
            # Update with valid IDs and frequency
            insight['report_ids'] = valid_report_ids
            insight['frequency'] = len(valid_report_ids)
            valid_insights.append(insight)
        
        logger.info(f"Validated {len(valid_insights)} insights")
        return valid_insights

    except Exception as e:
        logger.error(f"Bedrock error: {str(e)}")
        raise


def _deterministic_insight_id(insight: Dict) -> str:
    """Generate a deterministic ID based on issue type, category, and description prefix."""
    key = f"{insight['issue_type']}-{insight.get('category', '')}-{insight['description'][:50]}"
    return f"INSIGHT-{hashlib.sha256(key.encode()).hexdigest()[:12]}"


def store_insights(insights: List[Dict]) -> None:
    """Store insights in DynamoDB, merging duplicates by deterministic ID."""
    now = datetime.now(UTC).isoformat()

    for insight in insights:
        insight_id = _deterministic_insight_id(insight)

        # Check if this insight already exists
        existing_items = manager_insights_table.query(
            KeyConditionExpression='insightId = :id',
            ExpressionAttributeValues={':id': insight_id},
            Limit=1,
        ).get('Items', [])

        if existing_items:
            existing = existing_items[0]
            # Merge reportIds and update frequency
            merged_report_ids = list(set(existing.get('reportIds', []) + insight['report_ids']))
            manager_insights_table.update_item(
                Key={'insightId': insight_id, 'createdAt': existing['createdAt']},
                UpdateExpression='SET reportIds = :rids, frequency = :freq, updatedAt = :now',
                ExpressionAttributeValues={
                    ':rids': merged_report_ids,
                    ':freq': len(merged_report_ids),
                    ':now': now,
                },
            )
            logger.info(f"Merged insight: {insight_id} (now {len(merged_report_ids)} reports)")
        else:
            item = {
                'insightId': insight_id,
                'description': insight['description'],
                'category': insight.get('category', insight['description'][:20]),
                'issueType': insight['issue_type'],
                'frequency': insight['frequency'],
                'reportIds': insight['report_ids'],
                'recommendedAction': insight['recommended_action'],
                'status': 'new',
                'createdAt': now,
                'updatedAt': now,
                'managerActions': []
            }
            manager_insights_table.put_item(Item=item)
            logger.info(f"Stored new insight: {insight_id}")
