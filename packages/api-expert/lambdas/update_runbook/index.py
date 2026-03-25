import json
import logging
import os
import boto3
from botocore.config import Config
from datetime import datetime
import re

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
bedrock = boto3.client(
    'bedrock-runtime',
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
    config=Config(read_timeout=300, connect_timeout=10)
)
dynamodb = boto3.resource('dynamodb')

RUNBOOKS_BUCKET = os.environ['RUNBOOKS_BUCKET']
RUNBOOKS_METADATA_TABLE = os.environ['RUNBOOKS_METADATA_TABLE']
PROPOSALS_TABLE = os.environ['PROPOSALS_TABLE']
PATTERNS_TABLE = os.environ['PATTERNS_TABLE']
BEDROCK_MODEL_ID = os.environ['BEDROCK_MODEL_ID']
GUARDRAIL_ID = os.environ.get('BEDROCK_GUARDRAIL_ID')
GUARDRAIL_VERSION = os.environ.get('BEDROCK_GUARDRAIL_VERSION')

UPDATE_PROMPT = """You are a technical writer updating a nuclear maintenance runbook.

CURRENT RUNBOOK:
{current_runbook}

APPROVED MODIFICATION:
{proposal_details}

NEW VERSION: {new_version}
TODAY'S DATE: {today_date}

Task: Apply the modification PRECISELY to the runbook.

Requirements:
1. Update the "Version:" field in the header to {new_version}
2. Update the "Date:" field in the header to {today_date}
3. Locate the exact step mentioned in the proposal
4. Apply the modification type: {modification_type}
5. Preserve all other content exactly as-is
6. Maintain markdown formatting
7. Add version history entry at the end
8. Return the COMPLETE updated runbook

Output the FULL updated runbook content (not just the changed section).
"""

def increment_version(version):
    """Increment version number: v1.0 -> v1.1 or 3.2 -> 3.3"""
    # Try with 'v' prefix first
    match = re.match(r'v?(\d+)\.(\d+)', version)
    if match:
        major, minor = int(match.group(1)), int(match.group(2))
        # Preserve original format (with or without 'v' prefix)
        prefix = 'v' if version.startswith('v') else ''
        return f"{prefix}{major}.{minor + 1}"
    return "v1.1"

def lambda_handler(event, context):
    """
    Update runbooks based on approved proposals.
    Triggered by DynamoDB Stream or manual invocation.
    """
    
    logger.info(f"Received event: {json.dumps(event, default=str)}")
    
    # Get proposal ID from event
    proposal_id = event.get('proposalId')
    if not proposal_id:
        return {'statusCode': 400, 'message': 'proposalId required'}
    
    # Load proposal
    proposals_table = dynamodb.Table(PROPOSALS_TABLE)
    response = proposals_table.get_item(Key={'proposalId': proposal_id})
    
    if 'Item' not in response:
        return {'statusCode': 404, 'message': 'Proposal not found'}
    
    proposal = response['Item']
    
    if proposal['status'] != 'approved':
        return {'statusCode': 400, 'message': 'Proposal not approved'}
    
    runbook_id = proposal['runbookId']
    procedure_code = proposal['procedureCode']
    
    # Load runbook metadata
    metadata_table = dynamodb.Table(RUNBOOKS_METADATA_TABLE)
    response = metadata_table.get_item(Key={'runbookId': runbook_id})
    
    if 'Item' not in response:
        return {'statusCode': 404, 'message': 'Runbook metadata not found'}
    
    runbook_metadata = response['Item']
    current_version = runbook_metadata['version']
    current_s3_path = runbook_metadata.get('s3LatestPath') or runbook_metadata.get('s3Path')
    
    logger.info(f"Updating runbook {runbook_id} version {current_version}")
    
    # Load current runbook from S3
    try:
        response = s3.get_object(Bucket=RUNBOOKS_BUCKET, Key=current_s3_path)
        current_runbook = response['Body'].read().decode('utf-8')
    except Exception as e:
        logger.error(f"Error loading runbook: {e}")
        return {'statusCode': 500, 'message': f'Error loading runbook: {e}'}
    
    # Prepare modification details
    step_details = proposal['stepDetails']
    modification_type = proposal['modificationType']
    
    proposal_summary = f"""
Title: {proposal['title']}
Modification Type: {modification_type}
Step Number: {step_details['stepNumber']}
Step Title: {step_details['stepTitle']}

Current Instruction:
{step_details['currentInstruction']}

Proposed Instruction:
{step_details['proposedInstruction']}

Rationale:
{step_details['rationale']}
"""

    # Calculate new version before calling Bedrock
    new_version = increment_version(current_version)

    # Call Bedrock to apply modification
    prompt = UPDATE_PROMPT.format(
        current_runbook=current_runbook,
        proposal_details=proposal_summary,
        modification_type=modification_type,
        new_version=new_version,
        today_date=datetime.now().strftime('%Y-%m-%d')
    )
    
    try:
        converse_kwargs = {
            'modelId': BEDROCK_MODEL_ID,
            'messages': [{
                "role": "user",
                "content": [{"text": prompt}]
            }],
            'inferenceConfig': {
                "maxTokens": 16000,
                "temperature": 0.0,
            },
        }
        if GUARDRAIL_ID and GUARDRAIL_VERSION:
            converse_kwargs['guardrailConfig'] = {
                'guardrailIdentifier': GUARDRAIL_ID,
                'guardrailVersion': GUARDRAIL_VERSION,
            }
        response = bedrock.converse(**converse_kwargs)

        updated_runbook = response['output']['message']['content'][0]['text']
        
        # Remove markdown code blocks if present
        if updated_runbook.strip().startswith('```'):
            lines = updated_runbook.strip().split('\n')
            if lines[0].startswith('```'):
                lines = lines[1:]
            if lines and lines[-1].startswith('```'):
                lines = lines[:-1]
            updated_runbook = '\n'.join(lines)

        # Upload new version to S3
        new_s3_path = f"{runbook_id}/{new_version}/runbook.md"
        
        s3.put_object(
            Bucket=RUNBOOKS_BUCKET,
            Key=new_s3_path,
            Body=updated_runbook.encode('utf-8'),
            ContentType='text/markdown'
        )
        
        logger.info(f"Uploaded new version to {new_s3_path}")
        
        # Update metadata
        metadata_table.update_item(
            Key={'runbookId': runbook_id},
            UpdateExpression='SET version = :version, s3LatestPath = :path, lastUpdated = :updated, lastProposalId = :proposalId',
            ExpressionAttributeValues={
                ':version': new_version,
                ':path': new_s3_path,
                ':updated': datetime.now().isoformat(),
                ':proposalId': proposal_id
            }
        )
        
        # Update proposal status
        proposals_table.update_item(
            Key={'proposalId': proposal_id},
            UpdateExpression='SET appliedAt = :appliedAt, appliedVersion = :version',
            ExpressionAttributeValues={
                ':appliedAt': datetime.now().isoformat(),
                ':version': new_version
            }
        )
        
        # Update pattern status
        if 'patternId' in proposal:
            patterns_table = dynamodb.Table(PATTERNS_TABLE)
            patterns_table.update_item(
                Key={'patternId': proposal['patternId']},
                UpdateExpression='SET #status = :status, appliedAt = :appliedAt',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':status': 'applied',
                    ':appliedAt': datetime.now().isoformat()
                }
            )
        
        return {
            'statusCode': 200,
            'message': 'Runbook updated successfully',
            'runbookId': runbook_id,
            'oldVersion': current_version,
            'newVersion': new_version,
            'newS3Path': new_s3_path
        }
        
    except Exception as e:
        logger.exception(f"Error updating runbook: {e}")
        return {'statusCode': 500, 'message': f'Error: {str(e)}'}
