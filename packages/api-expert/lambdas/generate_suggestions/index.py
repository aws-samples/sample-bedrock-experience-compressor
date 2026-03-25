import json
import logging
import os
import boto3
from botocore.config import Config
from datetime import datetime
import uuid
from decimal import Decimal

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
PATTERNS_TABLE = os.environ['PATTERNS_TABLE']
PROPOSALS_TABLE = os.environ['PROPOSALS_TABLE']
BEDROCK_MODEL_ID = os.environ['BEDROCK_MODEL_ID']
GUARDRAIL_ID = os.environ.get('BEDROCK_GUARDRAIL_ID')
GUARDRAIL_VERSION = os.environ.get('BEDROCK_GUARDRAIL_VERSION')

def convert_floats_to_decimal(obj):
    """Convert all float values to Decimal for DynamoDB compatibility"""
    if isinstance(obj, list):
        return [convert_floats_to_decimal(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_floats_to_decimal(value) for key, value in obj.items()}
    elif isinstance(obj, float):
        return Decimal(str(obj))
    return obj

SUGGESTION_PROMPT = """You are a senior procedure expert with 20 years field experience.

CURRENT RUNBOOK STEP {step_number}:
{current_step}

PATTERN DETECTED:
{frequency} technicians reported: {description}
Root cause: {root_cause}

Task: Generate PRECISE, ACTIONABLE runbook modification.

Requirements:
1. Specify EXACT modification type (add_substep, modify_instruction, add_tool, add_safety_note, update_time)
2. Provide CURRENT text and PROPOSED text word-for-word
3. List NEW tools with exact models and specifications
4. Calculate time adjustment in minutes
5. Explain safety impact if applicable
6. Reference compliance standards
7. Provide implementation guidance

Output JSON with this structure:
{{
  "title": "Brief title",
  "modificationType": "add_substep|modify_instruction|add_tool|add_safety_note|update_time",
  "stepDetails": {{
    "stepNumber": {step_number},
    "stepTitle": "Step title",
    "currentInstruction": "Current text",
    "proposedInstruction": "Proposed text with NEW SUBSTEP X.Y: ...",
    "rationale": "Why this change",
    "newSubstepNumber": "2.3",
    "newSubstepText": "Exact substep text"
  }},
  "newToolsRequired": [
    {{
      "toolName": "Tool name",
      "specification": "Exact specs",
      "quantity": 1,
      "location": "Where to find it"
    }}
  ],
  "timeAdjustmentMinutes": 5,
  "safetyImpact": "CRITICAL|HIGH|MEDIUM|LOW - explanation",
  "complianceReferences": ["Applicable industry standard Section X"],
  "implementationNotes": "Step-by-step implementation",
  "estimatedCostEuros": 2400,
  "trainingRequired": true,
  "priority": "critical|high|medium|low"
}}
"""

def lambda_handler(event, context):
    """
    Generate precise suggestions for each pattern using Bedrock.
    Input: {patterns: [...]}
    Output: {proposals: [...]}
    """
    
    patterns = event.get('patterns', [])
    all_proposals = []
    
    patterns_table = dynamodb.Table(PATTERNS_TABLE)
    proposals_table = dynamodb.Table(PROPOSALS_TABLE)
    
    for pattern in patterns:
        # Skip rejected patterns
        if pattern.get('status') == 'expert_rejected':
            continue
        
        pattern_id = pattern['patternId']
        runbook_id = pattern['runbookId']
        procedure_code = pattern['procedureCode']
        affected_steps = pattern['affectedSteps']
        
        # Load runbook from DynamoDB to get S3 path
        # (In real implementation, would query runbooks metadata table)
        
        for step_num in affected_steps:
            # Prepare prompt
            prompt = SUGGESTION_PROMPT.format(
                step_number=step_num,
                current_step=f"Step {step_num}: {pattern['stepTitles'][0]}",
                frequency=pattern['frequency'],
                description=pattern['description'],
                root_cause=pattern['rootCause']
            )
            
            try:
                converse_kwargs = {
                    'modelId': BEDROCK_MODEL_ID,
                    'messages': [{
                        "role": "user",
                        "content": [{"text": prompt}]
                    }],
                    'inferenceConfig': {
                        "maxTokens": 4000,
                        "temperature": 0.1,
                    },
                }
                if GUARDRAIL_ID and GUARDRAIL_VERSION:
                    converse_kwargs['guardrailConfig'] = {
                        'guardrailIdentifier': GUARDRAIL_ID,
                        'guardrailVersion': GUARDRAIL_VERSION,
                    }
                response = bedrock.converse(**converse_kwargs)

                suggestion_json = response['output']['message']['content'][0]['text']
                
                # Remove markdown code blocks if present
                if suggestion_json.strip().startswith('```'):
                    suggestion_json = suggestion_json.strip()
                    suggestion_json = suggestion_json.split('```')[1]
                    if suggestion_json.startswith('json'):
                        suggestion_json = suggestion_json[4:]
                    suggestion_json = suggestion_json.strip()
                
                # Parse JSON response
                suggestion = json.loads(suggestion_json)
                
                # Convert floats to Decimal for DynamoDB
                suggestion = convert_floats_to_decimal(suggestion)

                # Create deterministic proposal ID to prevent duplicates
                # Format: {patternId}-step-{stepNum}
                proposal_id = f"{pattern_id}-step-{step_num}"

                # Check if proposal already exists for this pattern+step
                try:
                    existing = proposals_table.get_item(Key={'proposalId': proposal_id})
                    if 'Item' in existing:
                        logger.info(f"Proposal already exists for {proposal_id}, skipping")
                        continue
                except Exception as e:
                    logger.error(f"Error checking existing proposal: {e}")

                item = {
                    'proposalId': proposal_id,
                    'procedureCode': procedure_code,
                    'runbookId': runbook_id,
                    'patternId': pattern_id,
                    'title': suggestion['title'],
                    'affectedSteps': [step_num],
                    'modificationType': suggestion['modificationType'],
                    'stepDetails': suggestion['stepDetails'],
                    'newToolsRequired': suggestion.get('newToolsRequired', []),
                    'timeAdjustmentMinutes': suggestion.get('timeAdjustmentMinutes', 0),
                    'safetyImpact': suggestion.get('safetyImpact', ''),
                    'complianceReferences': suggestion.get('complianceReferences', []),
                    'implementationNotes': suggestion.get('implementationNotes', ''),
                    'estimatedCostEuros': suggestion.get('estimatedCostEuros', 0),
                    'trainingRequired': suggestion.get('trainingRequired', False),
                    'priority': suggestion.get('priority', 'medium'),
                    'evidence': {
                        'patternType': pattern['type'],
                        'frequency': pattern['frequency'],
                        'severity': pattern['severity'],
                        'reportIds': pattern['reportIds']
                    },
                    'status': 'pending',
                    'createdAt': datetime.now().isoformat(),
                    'createdBy': 'system',
                    'expertName': None,
                    'expertComments': None,
                    'reviewedAt': None
                }
                
                proposals_table.put_item(Item=item)
                all_proposals.append(item)
                
                # Update pattern status
                patterns_table.update_item(
                    Key={'patternId': pattern_id},
                    UpdateExpression='SET #status = :status',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':status': 'proposal_generated'}
                )
                
            except Exception as e:
                logger.exception(f"Error generating suggestion for pattern {pattern_id}: {e}")
                continue
    
    return {
        'statusCode': 200,
        'proposals': all_proposals,
        'totalProposals': len(all_proposals)
    }
