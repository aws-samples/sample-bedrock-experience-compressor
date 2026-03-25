"""
Reset Demo Lambda
Wipes all DynamoDB tables and re-seeds with demo data.
Admin-only — called from the frontend "Reset Demo" button.
"""
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')

# Tables from environment variables
TABLE_NAMES = {
    'tasks': os.environ['TASKS_TABLE'],
    'reports': os.environ['REPORTS_TABLE'],
    'reports_index': os.environ['REPORTS_INDEX_TABLE'],
    'proposals': os.environ['PROPOSALS_TABLE'],
    'patterns': os.environ['PATTERNS_TABLE'],
    'insights': os.environ['INSIGHTS_TABLE'],
    'runbooks_metadata': os.environ['RUNBOOKS_METADATA_TABLE'],
}

# CORS
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
    if origin.strip()
]

SEED_DIR = Path(__file__).parent


def get_cors_origin(event: Dict[str, Any]) -> str:
    """Validate and return CORS origin"""
    origin = (event.get('headers') or {}).get('origin', '')
    if origin in ALLOWED_ORIGINS:
        return origin
    return ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else ''


def cors_response(status: int, body: Dict[str, Any], origin: str) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
        },
        'body': json.dumps(body),
    }


def wipe_table(table_name: str) -> int:
    """Delete all items from a DynamoDB table"""
    table = dynamodb.Table(table_name)
    key_schema = table.key_schema
    key_names = [k['AttributeName'] for k in key_schema]

    count = 0
    scan = table.scan(ProjectionExpression=', '.join(key_names))

    while True:
        for item in scan.get('Items', []):
            key = {k: item[k] for k in key_names}
            table.delete_item(Key=key)
            count += 1

        if 'LastEvaluatedKey' not in scan:
            break
        scan = table.scan(
            ProjectionExpression=', '.join(key_names),
            ExclusiveStartKey=scan['LastEvaluatedKey'],
        )

    return count


def seed_table(table_name: str, items: List[Dict[str, Any]]) -> int:
    """Batch write items to a DynamoDB table"""
    table = dynamodb.Table(table_name)
    count = 0

    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)
            count += 1

    return count


def load_seed_file(filename: str) -> List[Dict[str, Any]]:
    """Load seed data from bundled JSON file, substituting placeholders"""
    path = SEED_DIR / filename
    content = path.read_text()
    runbooks_bucket = os.environ.get('RUNBOOKS_BUCKET', '')
    if runbooks_bucket:
        content = content.replace('{{RUNBOOKS_BUCKET}}', runbooks_bucket)
    return json.loads(content)


def get_scope(event: Dict[str, Any]) -> str:
    """Get optional scope from query string: tasks, proposals, insights, or all"""
    params = event.get('queryStringParameters') or {}
    return params.get('scope', 'all')


def reset_tasks_to_assigned() -> int:
    """Reset all tasks back to 'assigned' status for demo replay."""
    table = dynamodb.Table(TABLE_NAMES['tasks'])
    scan = table.scan()
    count = 0

    while True:
        for item in scan.get('Items', []):
            table.update_item(
                Key={'taskId': item['taskId']},
                UpdateExpression='SET #s = :status, updatedAt = :now REMOVE startedAt, completedAt',
                ExpressionAttributeNames={'#s': 'status'},
                ExpressionAttributeValues={
                    ':status': 'assigned',
                    ':now': '2026-03-19T08:00:00Z',
                },
            )
            count += 1

        if 'LastEvaluatedKey' not in scan:
            break
        scan = table.scan(ExclusiveStartKey=scan['LastEvaluatedKey'])

    return count


def reset_proposals_to_pending() -> int:
    """Reset all proposals back to 'pending' status for demo replay."""
    table = dynamodb.Table(TABLE_NAMES['proposals'])
    scan = table.scan()
    count = 0

    while True:
        for item in scan.get('Items', []):
            table.update_item(
                Key={'proposalId': item['proposalId']},
                UpdateExpression='SET #s = :status REMOVE expertName, expertComments, reviewedAt, appliedAt, appliedVersion',
                ExpressionAttributeNames={'#s': 'status'},
                ExpressionAttributeValues={':status': 'pending'},
            )
            count += 1

        if 'LastEvaluatedKey' not in scan:
            break
        scan = table.scan(ExclusiveStartKey=scan['LastEvaluatedKey'])

    return count


def reset_insights_to_new() -> int:
    """Reset all insights back to 'new' status for demo replay."""
    table = dynamodb.Table(TABLE_NAMES['insights'])
    scan = table.scan()
    count = 0

    while True:
        for item in scan.get('Items', []):
            table.update_item(
                Key={'insightId': item['insightId'], 'createdAt': item['createdAt']},
                UpdateExpression='SET #s = :status REMOVE managerActions',
                ExpressionAttributeNames={'#s': 'status'},
                ExpressionAttributeValues={':status': 'new'},
            )
            count += 1

        if 'LastEvaluatedKey' not in scan:
            break
        scan = table.scan(ExclusiveStartKey=scan['LastEvaluatedKey'])

    return count


VALID_SCOPES = ['tasks', 'proposals', 'insights', 'all']


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    origin = get_cors_origin(event)
    scope = get_scope(event)

    if scope not in VALID_SCOPES:
        return cors_response(400, {
            'error': f'Invalid scope: {scope}',
            'validScopes': VALID_SCOPES,
        }, origin)

    logger.info(f"Starting reset with scope={scope}")

    try:
        results = {}

        if scope == 'tasks':
            count = reset_tasks_to_assigned()
            results['tasks_reset'] = count
            label = 'Tasks reset to assigned'

        elif scope == 'proposals':
            count = reset_proposals_to_pending()
            results['proposals_reset'] = count
            label = 'Proposals reset to pending'

        elif scope == 'insights':
            count = reset_insights_to_new()
            results['insights_reset'] = count
            label = 'Insights reset to new'

        else:  # all
            for name, table_name in TABLE_NAMES.items():
                deleted = wipe_table(table_name)
                results[f'{name}_deleted'] = deleted

            seed_map = {
                'tasks': 'seed-tasks.json',
                'reports': 'seed-reports.json',
                'reports_index': 'seed-reports-index.json',
                'runbooks_metadata': 'seed-runbooks-metadata.json',
            }
            for name, filename in seed_map.items():
                items = load_seed_file(filename)
                seeded = seed_table(TABLE_NAMES[name], items)
                results[f'{name}_seeded'] = seeded

            label = 'Full demo reset'

        logger.info(f"{label} complete: {results}")

        return cors_response(200, {
            'message': label + ' complete',
            'results': results,
        }, origin)

    except Exception as e:
        logger.exception("Error during reset")
        return cors_response(500, {
            'error': 'Reset failed',
            'message': str(e),
        }, origin)
