"""
Manager API Lambda
Handles all manager API endpoints
"""
import json
import logging
import os
import boto3
from collections import Counter
from typing import Dict, Any, Optional
from datetime import datetime, UTC, timedelta

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
lambda_client = boto3.client('lambda')

# Get environment variables
insights_table = dynamodb.Table(os.environ['MANAGER_INSIGHTS_TABLE'])
reports_index_table = dynamodb.Table(os.environ['REPORTS_INDEX_TABLE'])
analysis_jobs_table = dynamodb.Table(os.environ['ANALYSIS_JOBS_TABLE'])
reports_bucket = os.environ['REPORTS_BUCKET']
analysis_lambda_arn = os.environ.get('ANALYSIS_LAMBDA_ARN', '')
proposals_table_name = os.environ.get('PROPOSALS_TABLE', '')
proposals_table = dynamodb.Table(proposals_table_name) if proposals_table_name else None
reports_table_name = os.environ.get('REPORTS_TABLE', '')
reports_table = dynamodb.Table(reports_table_name) if reports_table_name else None
tasks_table_name = os.environ.get('TASKS_TABLE', '')
tasks_table = dynamodb.Table(tasks_table_name) if tasks_table_name else None
technicians_table_name = os.environ.get('TECHNICIANS_TABLE', '')
technicians_table = dynamodb.Table(technicians_table_name) if technicians_table_name else None

# CORS configuration
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
    if origin.strip()
]


def get_cors_headers(origin: Optional[str] = None) -> Dict[str, str]:
    """Return CORS headers with validated origin"""
    headers = {
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    }
    if origin and origin in ALLOWED_ORIGINS:
        headers['Access-Control-Allow-Origin'] = origin
    elif ALLOWED_ORIGINS:
        headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0]
    return headers


def add_cors_headers(response: Dict[str, Any], origin: Optional[str] = None) -> Dict[str, Any]:
    """Add CORS headers to response"""
    if 'headers' not in response:
        response['headers'] = {}
    response['headers'].update(get_cors_headers(origin))
    return response


# Route handlers removed - using direct routing in lambda_handler


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for API Gateway proxy events
    Role-based access is enforced by the Lambda Authorizer at API Gateway level.
    """
    method = event.get('httpMethod', '')
    path = event.get('path', '')
    request_id = event.get('requestContext', {}).get('requestId', 'unknown')
    logger.info(f"Request: {method} {path} (requestId={request_id})")

    # Extract origin for CORS validation
    headers = event.get('headers') or {}
    origin = headers.get('origin') or headers.get('Origin')

    try:
        # Handle OPTIONS requests for CORS preflight
        if method == 'OPTIONS':
            return add_cors_headers({
                'statusCode': 200,
                'body': ''
            }, origin)

        # Route based on path and method
        # GET /api/manager/insights
        if method == 'GET' and path == '/api/manager/insights':
            response = get_insights({})
            return add_cors_headers(response, origin)

        # GET /api/manager/insights/{id}
        elif method == 'GET' and path.startswith('/api/manager/insights/') and path != '/api/manager/insights/':
            insight_id = path.split('/')[-1]
            response = get_insight_by_id(insight_id)
            return add_cors_headers(response, origin)

        # PUT /api/manager/insights/{id}
        elif method == 'PUT' and path.startswith('/api/manager/insights/'):
            insight_id = path.split('/')[-1]
            body = json.loads(event.get('body', '{}'))

            # Get manager ID from Lambda authorizer context
            request_context = event.get('requestContext', {})
            authorizer = request_context.get('authorizer', {})
            manager_id = authorizer.get('sub', 'unknown')

            response = update_insight(insight_id, body, manager_id)
            return add_cors_headers(response, origin)

        # GET /api/trends
        elif method == 'GET' and path == '/api/manager/trends':
            query_params = event.get('queryStringParameters') or {}
            response = get_trends(query_params)
            return add_cors_headers(response, origin)

        # POST /api/analysis - Trigger manual analysis
        elif method == 'POST' and path == '/api/manager/analysis':
            response = trigger_analysis()
            return add_cors_headers(response, origin)

        # GET /api/analysis - Get analysis history
        elif method == 'GET' and path == '/api/manager/analysis':
            response = get_analysis_history()
            return add_cors_headers(response, origin)

        # GET /api/runbook-metrics
        elif method == 'GET' and path == '/api/manager/runbook-metrics':
            response = get_runbook_metrics()
            return add_cors_headers(response, origin)

        # GET /api/team-metrics
        elif method == 'GET' and path == '/api/manager/team-metrics':
            response = get_team_metrics()
            return add_cors_headers(response, origin)

        # GET /api/planning
        elif method == 'GET' and path == '/api/manager/planning':
            query_params = event.get('queryStringParameters') or {}
            response = get_planning(query_params)
            return add_cors_headers(response, origin)

        # GET /api/report-metrics
        elif method == 'GET' and path == '/api/manager/report-metrics':
            response = get_report_metrics()
            return add_cors_headers(response, origin)

        # GET /api/manager/planning/monthly
        elif method == 'GET' and path == '/api/manager/planning/monthly':
            query_params = event.get('queryStringParameters') or {}
            response = get_monthly_planning(query_params)
            return add_cors_headers(response, origin)

        # Not found
        else:
            return add_cors_headers({
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Not found', 'path': path, 'method': method})
            }, origin)

    except Exception as e:
        logger.exception("Unhandled error in lambda_handler")
        return add_cors_headers({
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }, origin)


def get_insights(query_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    GET /api/manager/insights - Retrieve all insights
    Scans ManagerInsights table and returns all insights
    """
    try:
        # Scan the entire ManagerInsights table
        logger.info("Scanning ManagerInsights table")
        response = insights_table.scan()
        insights = response.get('Items', [])
        
        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = insights_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            insights.extend(response.get('Items', []))
        
        logger.info(f"Retrieved {len(insights)} insights from table")
        
        # Sort by frequency descending (highest first)
        insights.sort(key=lambda x: x.get('frequency', 0), reverse=True)
        
        logger.info(f"Returning {len(insights)} insights")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'insights': insights,
                'count': len(insights)
            }, default=str)
        }
        
    except Exception as e:
        logger.exception("Error in get_insights")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Failed to retrieve insights', 'message': str(e)})
        }


def get_insight_by_id(insight_id: str) -> Dict[str, Any]:
    """
    GET /api/manager/insights/:id - Retrieve a single insight by ID
    """
    try:
        logger.info(f"Fetching insight {insight_id}")
        response = insights_table.get_item(Key={'insightId': insight_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': f'Insight not found: {insight_id}'})
            }
        
        insight = response['Item']
        logger.info(f"Retrieved insight {insight_id}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(insight, default=str)
        }
        
    except Exception as e:
        logger.exception(f"Error fetching insight {insight_id}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Failed to retrieve insight', 'message': str(e)})
        }



def update_insight(insight_id: str, body: Dict[str, Any], manager_id: str) -> Dict[str, Any]:
    """
    PUT /api/manager/insights/:id - Update insight with manager action
    
    Request body:
    - action: Action type (accept, dismiss, modify, resolve)
    - notes: Optional notes from manager
    - modifiedAction: Modified recommendation (required if action=modify)
    - dismissReason: Reason for dismissal (required if action=dismiss)
    
    Status transitions:
    - accept: new -> in-progress
    - dismiss: any -> dismissed
    - modify: any -> in-progress
    - resolve: in-progress -> resolved
    """
    try:
        # Validate required fields
        action = body.get('action')
        if not action:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing required field: action'})
            }
        
        # Validate action type
        valid_actions = ['accept', 'dismiss', 'modify', 'resolve']
        if action not in valid_actions:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': f'Invalid action. Must be one of: {", ".join(valid_actions)}'
                })
            }
        
        # Validate action-specific requirements
        if action == 'modify' and not body.get('modifiedAction'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'modifiedAction is required when action=modify'})
            }
        
        if action == 'dismiss' and not body.get('dismissReason'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'dismissReason is required when action=dismiss'})
            }
        
        # Get current insight - need to query since we have composite key
        logger.info(f"Fetching insight {insight_id}")
        query_response = insights_table.query(
            KeyConditionExpression='insightId = :id',
            ExpressionAttributeValues={':id': insight_id},
            Limit=1
        )
        
        if not query_response.get('Items'):
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': f'Insight not found: {insight_id}'})
            }
        
        insight = query_response['Items'][0]
        logger.info(f"Current insight status: {insight.get('status')}")
        
        # Determine new status based on action
        new_status = insight.get('status')
        if action == 'accept':
            new_status = 'in-progress'
        elif action == 'dismiss':
            new_status = 'dismissed'
        elif action == 'modify':
            new_status = 'in-progress'
        elif action == 'resolve':
            new_status = 'resolved'
        
        # Create manager action record
        manager_action = {
            'actionType': action,
            'timestamp': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            'managerId': manager_id,
        }
        if body.get('notes'):
            manager_action['notes'] = body['notes']
        
        # Add action-specific fields
        if action == 'modify':
            manager_action['modifiedAction'] = body.get('modifiedAction')
        if action == 'dismiss':
            manager_action['dismissReason'] = body.get('dismissReason')
        
        # Get existing manager actions or initialize empty list
        manager_actions = insight.get('managerActions', [])
        manager_actions.append(manager_action)
        
        # Update insight in DynamoDB
        logger.info(f"Updating insight {insight_id} with action {action}, new status: {new_status}")
        
        update_response = insights_table.update_item(
            Key={'insightId': insight_id, 'createdAt': insight['createdAt']},
            UpdateExpression='SET #status = :status, managerActions = :actions, updatedAt = :updated',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': new_status,
                ':actions': manager_actions,
                ':updated': datetime.now(UTC).isoformat().replace('+00:00', 'Z')
            },
            ReturnValues='ALL_NEW'
        )
        
        updated_insight = update_response['Attributes']
        logger.info(f"Successfully updated insight {insight_id}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'insight': updated_insight,
                'message': f'Insight {action}ed successfully'
            }, default=str)
        }
        
    except Exception as e:
        logger.exception(f"Error updating insight {insight_id}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Failed to update insight', 'message': str(e)})
        }


def get_trends(query_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    GET /api/trends - Calculate trend data
    
    Query parameters:
    - period: Time period in days (7, 30, 90, 365, default: 30)
    
    Returns:
    - Current period metrics (tool issues, equipment issues, issue rate)
    - Previous period metrics (same duration before current period)
    - Comparison and trend direction (improving, degrading, stable)
    """
    try:
        # Parse period parameter
        period_days = int(query_params.get('period', '30'))
        valid_periods = [7, 30, 90, 365]
        if period_days not in valid_periods:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': f'Invalid period. Must be one of: {", ".join(map(str, valid_periods))}'
                })
            }
        
        logger.info(f"Calculating trends for {period_days} day period")
        
        # Calculate date ranges
        current_end = datetime.now(UTC)
        current_start = current_end - timedelta(days=period_days)
        previous_end = current_start
        previous_start = previous_end - timedelta(days=period_days)
        
        # Format dates as ISO strings
        current_start_str = current_start.isoformat().replace('+00:00', 'Z')
        current_end_str = current_end.isoformat().replace('+00:00', 'Z')
        previous_start_str = previous_start.isoformat().replace('+00:00', 'Z')
        previous_end_str = previous_end.isoformat().replace('+00:00', 'Z')
        
        logger.info(f"Current period: {current_start_str} to {current_end_str}")
        logger.info(f"Previous period: {previous_start_str} to {previous_end_str}")
        
        # Query ReportsIndex for current period
        current_reports = query_reports_by_date_range(current_start_str, current_end_str)
        logger.info(f"Found {len(current_reports)} reports in current period")
        
        # Query ReportsIndex for previous period
        previous_reports = query_reports_by_date_range(previous_start_str, previous_end_str)
        logger.info(f"Found {len(previous_reports)} reports in previous period")
        
        # Calculate metrics for current period
        current_metrics = calculate_period_metrics(current_reports)
        
        # Calculate metrics for previous period
        previous_metrics = calculate_period_metrics(previous_reports)
        
        # Calculate changes and trend directions
        changes = calculate_trend_changes(current_metrics, previous_metrics)
        
        # Build response
        result = {
            'period': {
                'days': period_days,
                'label': get_period_label(period_days),
                'current': {
                    'start': current_start_str,
                    'end': current_end_str
                },
                'previous': {
                    'start': previous_start_str,
                    'end': previous_end_str
                }
            },
            'current': current_metrics,
            'previous': previous_metrics,
            'changes': changes
        }
        
        logger.info("Successfully calculated trends")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(result, default=str)
        }
        
    except ValueError as e:
        logger.error(f"Invalid period parameter: {e}")
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid period parameter', 'message': str(e)})
        }
    except Exception as e:
        logger.exception("Error calculating trends")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Failed to calculate trends', 'message': str(e)})
        }


def query_reports_by_date_range(start_date: str, end_date: str) -> list:
    """Query ReportsIndex table for reports in date range using GSI"""
    try:
        response = reports_index_table.query(
            IndexName='createdAt-index',
            KeyConditionExpression='indexPartition = :pk AND createdAt BETWEEN :start AND :end_date',
            ExpressionAttributeValues={
                ':pk': 'ALL',
                ':start': start_date,
                ':end_date': end_date
            }
        )

        reports = response.get('Items', [])

        while 'LastEvaluatedKey' in response:
            response = reports_index_table.query(
                IndexName='createdAt-index',
                KeyConditionExpression='indexPartition = :pk AND createdAt BETWEEN :start AND :end_date',
                ExpressionAttributeValues={
                    ':pk': 'ALL',
                    ':start': start_date,
                    ':end_date': end_date
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            reports.extend(response.get('Items', []))

        return reports

    except Exception as e:
        logger.warning(f"Error querying reports by date range: {start_date} to {end_date}: {e}")
        raise


def calculate_period_metrics(reports: list) -> Dict[str, Any]:
    """Calculate metrics for a set of reports"""
    try:
        total_reports = len(reports)
        
        if total_reports == 0:
            return {
                'totalReports': 0,
                'toolIssueFrequency': 0,
                'equipmentIssueFrequency': 0,
                'reportsWithIssues': 0,
                'issueRate': 0.0
            }
        
        # Fetch report content from S3 and analyze for issues
        tool_issues = 0
        equipment_issues = 0
        reports_with_issues = 0
        
        for report in reports:
            s3_key = report.get('s3Key')
            if not s3_key:
                continue
            
            try:
                # Fetch report content from S3
                response = s3_client.get_object(Bucket=reports_bucket, Key=s3_key)
                content = response['Body'].read().decode('utf-8')
                
                # Simple keyword-based detection (can be enhanced with AI later)
                has_issue = False
                
                # Check for tool-related issues
                tool_keywords = ['tool', 'wrench', 'calibration', 'equipment missing', 'unavailable']
                if any(keyword.lower() in content.lower() for keyword in tool_keywords):
                    tool_issues += 1
                    has_issue = True
                
                # Check for equipment readiness issues
                equipment_keywords = ['battery', 'dead battery', 'broken', 'malfunction', 'not working']
                if any(keyword.lower() in content.lower() for keyword in equipment_keywords):
                    equipment_issues += 1
                    has_issue = True
                
                if has_issue:
                    reports_with_issues += 1
                    
            except Exception as e:
                logger.warning(f"Failed to fetch report {s3_key}: {e}")
                continue
        
        # Calculate issue rate
        issue_rate = reports_with_issues / total_reports if total_reports > 0 else 0.0
        
        return {
            'totalReports': total_reports,
            'toolIssueFrequency': tool_issues,
            'equipmentIssueFrequency': equipment_issues,
            'reportsWithIssues': reports_with_issues,
            'issueRate': round(issue_rate, 3)
        }
        
    except Exception as e:
        logger.warning(f"Error calculating period metrics: {e}")
        raise


def calculate_trend_changes(current: Dict[str, Any], previous: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate changes and trend directions between periods"""
    try:
        changes = {}
        
        # Tool issue frequency
        tool_change = current['toolIssueFrequency'] - previous['toolIssueFrequency']
        tool_direction = get_trend_direction(tool_change, lower_is_better=True)
        changes['toolIssueFrequency'] = {
            'value': tool_change,
            'direction': tool_direction,
            'percentChange': calculate_percent_change(
                previous['toolIssueFrequency'],
                current['toolIssueFrequency']
            )
        }
        
        # Equipment issue frequency
        equipment_change = current['equipmentIssueFrequency'] - previous['equipmentIssueFrequency']
        equipment_direction = get_trend_direction(equipment_change, lower_is_better=True)
        changes['equipmentIssueFrequency'] = {
            'value': equipment_change,
            'direction': equipment_direction,
            'percentChange': calculate_percent_change(
                previous['equipmentIssueFrequency'],
                current['equipmentIssueFrequency']
            )
        }
        
        # Issue rate
        rate_change = current['issueRate'] - previous['issueRate']
        rate_direction = get_trend_direction(rate_change, lower_is_better=True)
        changes['issueRate'] = {
            'value': round(rate_change, 3),
            'direction': rate_direction,
            'percentChange': calculate_percent_change(
                previous['issueRate'],
                current['issueRate']
            )
        }
        
        return changes
        
    except Exception as e:
        logger.warning(f"Error calculating trend changes: {e}")
        raise


def get_trend_direction(change: float, lower_is_better: bool = True) -> str:
    """
    Determine trend direction based on change value
    
    Args:
        change: Numeric change (current - previous)
        lower_is_better: If True, negative change is improving
    
    Returns:
        'improving', 'degrading', or 'stable'
    """
    threshold = 0.05  # 5% threshold for stability
    
    if abs(change) < threshold:
        return 'stable'
    
    if lower_is_better:
        return 'improving' if change < 0 else 'degrading'
    else:
        return 'improving' if change > 0 else 'degrading'


def calculate_percent_change(previous: float, current: float) -> Optional[float]:
    """Calculate percent change between two values"""
    if previous == 0:
        return None if current == 0 else float('inf')
    
    return round(((current - previous) / previous) * 100, 1)


def get_period_label(days: int) -> str:
    """Get human-readable label for period"""
    labels = {
        7: 'Last 7 days',
        30: 'Last 30 days',
        90: 'Last 90 days',
        365: 'Last year'
    }
    return labels.get(days, f'Last {days} days')



def trigger_analysis() -> Dict[str, Any]:
    """
    POST /api/analysis - Trigger manual analysis job
    Invokes the Analysis Lambda asynchronously
    """
    try:
        logger.info("Triggering manual analysis")
        
        if not analysis_lambda_arn:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Analysis Lambda ARN not configured'})
            }
        
        # Invoke Analysis Lambda asynchronously
        response = lambda_client.invoke(
            FunctionName=analysis_lambda_arn,
            InvocationType='Event',  # Async invocation
            Payload=json.dumps({})
        )
        
        logger.info(f"Analysis Lambda invoked: StatusCode={response['StatusCode']}")
        
        return {
            'statusCode': 202,  # Accepted
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Analysis job started successfully',
                'timestamp': datetime.now(UTC).isoformat().replace('+00:00', 'Z')
            })
        }
        
    except Exception as e:
        logger.exception("Error triggering analysis")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Failed to trigger analysis', 'message': str(e)})
        }


def get_analysis_history() -> Dict[str, Any]:
    """
    GET /api/analysis - Get analysis job history
    Returns list of analysis jobs sorted by date (most recent first)
    """
    try:
        logger.info("Fetching analysis history")
        
        # Scan analysis jobs table
        response = analysis_jobs_table.scan()
        jobs = response.get('Items', [])
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = analysis_jobs_table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            jobs.extend(response.get('Items', []))
        
        # Sort by startedAt descending (most recent first)
        jobs.sort(key=lambda x: x.get('startedAt', ''), reverse=True)
        
        logger.info(f"Retrieved {len(jobs)} analysis jobs")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'jobs': jobs,
                'count': len(jobs)
            }, default=str)
        }
        
    except Exception as e:
        logger.exception("Error fetching analysis history")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Failed to fetch analysis history', 'message': str(e)})
        }


def get_runbook_metrics() -> Dict[str, Any]:
    """Get runbook update metrics from proposals table"""
    try:
        if not proposals_table:
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'metrics': {'updatedRunbooks': 0, 'totalTimeSavedMinutes': 0, 'totalCostEuros': 0, 'proposals': []}})}

        result = proposals_table.scan()
        items = result.get('Items', [])
        while 'LastEvaluatedKey' in result:
            result = proposals_table.scan(ExclusiveStartKey=result['LastEvaluatedKey'])
            items.extend(result.get('Items', []))

        approved = [p for p in items if p.get('status') == 'approved']
        pending = [p for p in items if p.get('status') == 'pending']
        rejected = [p for p in items if p.get('status') in ('rejected', 'expert_rejected')]

        total_time_saved = sum(int(p.get('timeAdjustmentMinutes', 0)) for p in approved)
        total_cost = sum(int(p.get('estimatedCostEuros', 0)) for p in approved)
        runbook_ids = list(set(p.get('runbookId', '') for p in approved if p.get('runbookId')))

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'metrics': {
                    'updatedRunbooks': len(runbook_ids),
                    'totalTimeSavedMinutes': total_time_saved,
                    'totalCostEuros': total_cost,
                    'runbookIds': runbook_ids,
                    'approvedCount': len(approved),
                    'pendingCount': len(pending),
                    'rejectedCount': len(rejected),
                    'totalProposals': len(items),
                }
            }, default=str)
        }
    except Exception as e:
        logger.exception("Error fetching runbook metrics")
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})}


def get_team_metrics() -> Dict[str, Any]:
    """Get technician performance metrics from tasks and technicians tables"""
    try:
        if not tasks_table or not technicians_table:
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'technicians': []})}

        # Fetch all technicians
        tech_result = technicians_table.scan()
        techs = {t['technicianId']: t for t in tech_result.get('Items', [])}

        # Fetch all tasks
        task_result = tasks_table.scan()
        all_tasks = task_result.get('Items', [])
        while 'LastEvaluatedKey' in task_result:
            task_result = tasks_table.scan(ExclusiveStartKey=task_result['LastEvaluatedKey'])
            all_tasks.extend(task_result.get('Items', []))

        # Fetch all reports
        report_result = reports_index_table.scan()
        all_reports = report_result.get('Items', [])

        # Aggregate per technician
        team = []
        for tid, tech in techs.items():
            my_tasks = [t for t in all_tasks if t.get('assignedTo') == tid]
            completed = [t for t in my_tasks if t.get('status') == 'completed']
            in_progress = [t for t in my_tasks if t.get('status') == 'in_progress']
            # Count reports linked to tasks assigned to this tech
            my_runbook_ids = set(t.get('runbookId', '') for t in my_tasks)
            my_reports = [r for r in all_reports if r.get('runbookId', '') in my_runbook_ids]

            # Extract most frequent location from assigned tasks
            task_locations = [t.get('location', '') for t in my_tasks if t.get('location')]
            location = Counter(task_locations).most_common(1)[0][0] if task_locations else ''

            team.append({
                'technicianId': tid,
                'name': tech.get('name', 'Unknown'),
                'location': location,
                'skills': tech.get('skills', []),
                'totalTasks': len(my_tasks),
                'completedTasks': len(completed),
                'inProgressTasks': len(in_progress),
                'reportsSubmitted': len(my_reports),
                'completionRate': round(len(completed) / len(my_tasks) * 100) if my_tasks else 0,
            })

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'technicians': team}, default=str)
        }
    except Exception as e:
        logger.exception("Error fetching team metrics")
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})}


def get_planning(query_params: Dict[str, Any]) -> Dict[str, Any]:
    """GET /api/planning - Get weekly planning grouped by technician"""
    try:
        if not tasks_table or not technicians_table:
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'week': '', 'technicians': []})}

        # Parse week parameter (ISO format YYYY-Www) or default to current week
        week_param = query_params.get('week', '')
        if week_param:
            # Parse YYYY-Www to get Monday date
            year, week_num = int(week_param[:4]), int(week_param.split('W')[1])
            monday = datetime.strptime(f'{year}-W{week_num:02d}-1', '%G-W%V-%u').replace(tzinfo=UTC)
        else:
            today = datetime.now(UTC)
            monday = today - timedelta(days=today.weekday())
            monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
            year = int(monday.strftime('%G'))
            week_num = int(monday.strftime('%V'))
            week_param = f'{year}-W{week_num:02d}'

        friday = monday + timedelta(days=4, hours=23, minutes=59, seconds=59)
        monday_str = monday.strftime('%Y-%m-%d')
        friday_str = friday.strftime('%Y-%m-%d')

        # Fetch all technicians
        tech_result = technicians_table.scan()
        techs = {t['technicianId']: t for t in tech_result.get('Items', [])}

        # Fetch all tasks and filter by scheduledDate within the week
        task_result = tasks_table.scan()
        all_tasks = task_result.get('Items', [])
        while 'LastEvaluatedKey' in task_result:
            task_result = tasks_table.scan(ExclusiveStartKey=task_result['LastEvaluatedKey'])
            all_tasks.extend(task_result.get('Items', []))

        week_tasks = [t for t in all_tasks
                      if monday_str <= t.get('scheduledDate', '')[:10] <= friday_str]

        # Group by technician
        planning = []
        for tid, tech in techs.items():
            tech_tasks = sorted(
                [t for t in week_tasks if t.get('assignedTo') == tid],
                key=lambda t: t.get('scheduledDate', '')
            )
            planning.append({
                'technicianId': tid,
                'name': tech.get('name', 'Unknown'),
                'tasks': [{
                    'taskId': t['taskId'],
                    'title': t.get('title', ''),
                    'location': t.get('location', ''),
                    'scheduledDate': t.get('scheduledDate', ''),
                    'estimatedDuration': int(t.get('estimatedDuration', 0)),
                    'priority': t.get('priority', 'medium'),
                    'status': t.get('status', 'assigned'),
                } for t in tech_tasks]
            })

        # Sort: technicians with tasks first
        planning.sort(key=lambda p: (-len(p['tasks']), p['name']))

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'week': week_param,
                'weekStart': monday_str,
                'weekEnd': friday_str,
                'technicians': planning,
            }, default=str)
        }
    except Exception as e:
        logger.exception("Error fetching planning")
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})}


def get_report_metrics() -> Dict[str, Any]:
    """GET /api/report-metrics - Calculate real KPIs from Reports + Tasks tables"""
    try:
        if not reports_table:
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Reports table not configured'})}

        # Scan all reports
        result = reports_table.scan()
        all_reports = result.get('Items', [])
        while 'LastEvaluatedKey' in result:
            result = reports_table.scan(ExclusiveStartKey=result['LastEvaluatedKey'])
            all_reports.extend(result.get('Items', []))

        total = len(all_reports)
        if total == 0:
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'totalReports': 0, 'successRate': 0, 'delayRate': 0,
                                        'avgRating': 0, 'ratingDistribution': {}, 'delayReasons': {},
                                        'monthlyTrend': []})}

        # Basic KPIs
        ok_count = sum(1 for r in all_reports if r.get('everythingOk'))
        delay_count = sum(1 for r in all_reports if r.get('hadDelays'))
        ratings = [int(r.get('runbookRating', 0)) for r in all_reports if r.get('runbookRating')]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

        # Rating distribution
        rating_dist = {str(i): 0 for i in range(1, 6)}
        for r in ratings:
            if 1 <= r <= 5:
                rating_dist[str(r)] += 1

        # Delay reasons (only from reports with actual delays)
        delay_reasons = {}
        for r in all_reports:
            if not r.get('hadDelays'):
                continue
            reason = r.get('delayReason', '')
            if reason and not reason.lower().startswith('none'):
                # Truncate to first phrase for grouping
                short = reason.split('.')[0].split('(')[0].strip()[:60]
                delay_reasons[short] = delay_reasons.get(short, 0) + 1

        # Monthly trend
        monthly = {}
        for r in all_reports:
            date_str = r.get('completedAt', r.get('createdAt', ''))[:7]  # YYYY-MM
            if not date_str:
                continue
            if date_str not in monthly:
                monthly[date_str] = {'interventions': 0, 'delays': 0, 'durations': [],
                                     'estimated': [], 'ratings': []}
            monthly[date_str]['interventions'] += 1
            if r.get('hadDelays'):
                monthly[date_str]['delays'] += 1
            dur = r.get('actualDuration')
            if dur:
                monthly[date_str]['durations'].append(int(dur))
            est = r.get('estimatedDuration')
            if not est and tasks_table:
                # Try to get from task
                task_id = r.get('taskId')
                if task_id:
                    try:
                        task_resp = tasks_table.get_item(Key={'taskId': task_id})
                        est = task_resp.get('Item', {}).get('estimatedDuration')
                    except Exception as e:
                        logger.warning(f"Failed to get task {task_id}: {e}")
            if est:
                monthly[date_str]['estimated'].append(int(est))
            rt = r.get('runbookRating')
            if rt:
                monthly[date_str]['ratings'].append(int(rt))

        monthly_trend = []
        for month in sorted(monthly.keys()):
            m = monthly[month]
            monthly_trend.append({
                'month': month,
                'interventions': m['interventions'],
                'delays': m['delays'],
                'delayRate': round(m['delays'] / m['interventions'] * 100, 1) if m['interventions'] else 0,
                'avgDuration': round(sum(m['durations']) / len(m['durations'])) if m['durations'] else 0,
                'avgEstimated': round(sum(m['estimated']) / len(m['estimated'])) if m['estimated'] else 0,
                'avgRating': round(sum(m['ratings']) / len(m['ratings']), 1) if m['ratings'] else 0,
            })

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'totalReports': total,
                'successRate': round(ok_count / total * 100, 1),
                'delayRate': round(delay_count / total * 100, 1),
                'avgRating': avg_rating,
                'ratingDistribution': rating_dist,
                'delayReasons': delay_reasons,
                'monthlyTrend': monthly_trend,
            }, default=str)
        }
    except Exception as e:
        logger.exception("Error fetching report metrics")
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})}


def get_monthly_planning(query_params: Dict[str, Any]) -> Dict[str, Any]:
    """GET /api/planning/monthly - Get monthly planning grouped by technician"""
    try:
        if not tasks_table or not technicians_table:
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'month': '', 'technicians': []})}

        # Parse month parameter (YYYY-MM) or default to current month
        month_param = query_params.get('month', '')
        if month_param:
            year, mon = int(month_param[:4]), int(month_param[5:7])
        else:
            today = datetime.now(UTC)
            year, mon = today.year, today.month
            month_param = f'{year}-{mon:02d}'

        # Calculate month boundaries
        month_start = f'{year}-{mon:02d}-01'
        from calendar import monthrange
        days_in_month = monthrange(year, mon)[1]
        month_end = f'{year}-{mon:02d}-{days_in_month}'

        # Fetch all technicians
        tech_result = technicians_table.scan()
        techs = {t['technicianId']: t for t in tech_result.get('Items', [])}

        # Fetch all tasks and filter by scheduledDate within the month
        task_result = tasks_table.scan()
        all_tasks = task_result.get('Items', [])
        while 'LastEvaluatedKey' in task_result:
            task_result = tasks_table.scan(ExclusiveStartKey=task_result['LastEvaluatedKey'])
            all_tasks.extend(task_result.get('Items', []))

        month_tasks = [t for t in all_tasks
                       if month_start <= t.get('scheduledDate', '')[:10] <= month_end]

        # Group by technician
        planning = []
        for tid, tech in techs.items():
            tech_tasks = sorted(
                [t for t in month_tasks if t.get('assignedTo') == tid],
                key=lambda t: t.get('scheduledDate', '')
            )
            planning.append({
                'technicianId': tid,
                'name': tech.get('name', 'Unknown'),
                'tasks': [{
                    'taskId': t['taskId'],
                    'title': t.get('title', ''),
                    'location': t.get('location', ''),
                    'scheduledDate': t.get('scheduledDate', ''),
                    'estimatedDuration': int(t.get('estimatedDuration', 0)),
                    'priority': t.get('priority', 'medium'),
                    'status': t.get('status', 'assigned'),
                } for t in tech_tasks]
            })

        # Sort: technicians with tasks first
        planning.sort(key=lambda p: (-len(p['tasks']), p['name']))

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'month': month_param,
                'monthStart': month_start,
                'monthEnd': month_end,
                'daysInMonth': days_in_month,
                'technicians': planning,
            }, default=str)
        }
    except Exception as e:
        logger.exception("Error fetching monthly planning")
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})}
