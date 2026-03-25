import json
import logging
import os
import boto3
from botocore.config import Config
from datetime import datetime

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
BEDROCK_MODEL_ID = os.environ['BEDROCK_MODEL_ID']
GUARDRAIL_ID = os.environ.get('BEDROCK_GUARDRAIL_ID')
GUARDRAIL_VERSION = os.environ.get('BEDROCK_GUARDRAIL_VERSION')

ANALYSIS_PROMPT = """You are a Level 3 Nuclear Safety Inspector with 25 years of experience in:
- PWR/BWR maintenance procedures and industry standards
- ASME Section XI (In-Service Inspection)
- Regulatory guides for quality assurance
- Maintenance of pressure equipment
- Human Factors Engineering
- Root Cause Analysis (5-Whys, Fishbone, Barrier Analysis)

RUNBOOK: {runbook_details}

FIELD REPORTS: {reports}

Task: Identify SPECIFIC, ACTIONABLE patterns requiring runbook modifications.

Requirements:
1. Map to EXACT step numbers
2. Identify specific deficiency in current instruction
3. Perform 5-Whys root cause analysis
4. Reference applicable industry standards
5. Classify severity (critical/high/medium/low)
6. Only report patterns with 3+ occurrences

CRITICAL: Return ONLY valid JSON array. No markdown, no explanations, no code blocks.
Start your response with [ and end with ]

Output JSON array with this structure:
[
  {{
    "type": "safety_critical|procedural_gap|equipment_deficiency|human_factors",
    "affectedSteps": [2],
    "stepTitles": ["Depressurization"],
    "frequency": 9,
    "severity": "critical|high|medium|low",
    "description": "Brief description (max 200 chars)",
    "rootCause": "Root cause analysis (max 500 chars)",
    "specificDeficiency": "What's missing in current instruction (max 300 chars)",
    "reportIds": ["report-abc123"],
    "evidenceSummary": "Summary of evidence (max 400 chars)",
    "safetyImpact": "Safety impact if applicable (max 300 chars)",
    "regulatoryConcern": "Compliance references (max 200 chars)",
    "humanFactorsAnalysis": "Human factors analysis (max 300 chars)",
    "recommendedAction": "Recommended action (max 400 chars)"
  }}
]
"""

def lambda_handler(event, context):
    """
    Analyze reports with Bedrock Claude Sonnet 4.5 to identify patterns.
    Input: {procedures: [{procedureCode, runbookId, reports, runbook}]}
    Output: {patterns: [...]}
    """
    
    logger.info(f"Received event: {json.dumps(event)}")
    procedures = event.get('procedures', [])
    logger.info(f"Found {len(procedures)} procedures")
    all_patterns = []
    table = dynamodb.Table(PATTERNS_TABLE)
    
    for procedure in procedures:
        runbook_id = procedure['runbookId']
        procedure_code = procedure['procedureCode']
        reports = procedure['reports']
        runbook = procedure['runbook']
        
        logger.info(f"Processing {runbook_id} with {len(reports)} reports")

        if len(reports) < 2:
            logger.warning(f"Skipping {runbook_id}: only {len(reports)} reports (need 2+)")
            continue  # Need at least 2 reports to detect patterns
        
        # Load full runbook from S3
        s3_path = runbook.get('s3Path') or runbook.get('s3LatestPath')
        if not s3_path:
            logger.error(f"No S3 path found for runbook {runbook_id}")
            continue
            
        try:
            response = s3.get_object(Bucket=RUNBOOKS_BUCKET, Key=s3_path)
            runbook_content = response['Body'].read().decode('utf-8')
        except Exception as e:
            logger.error(f"Error loading runbook {runbook_id}: {e}")
            continue
        
        # Prepare reports summary
        reports_text = "\n\n".join([
            f"Report {r['reportId']} ({r['date']}):\n{r['content']}"
            for r in reports
        ])
        
        # Call Bedrock
        prompt = ANALYSIS_PROMPT.format(
            runbook_details=runbook_content,
            reports=reports_text
        )
        
        logger.info(f"Prompt length: {len(prompt)} chars, ~{len(prompt)//4} tokens")
        logger.info(f"Runbook content length: {len(runbook_content)} chars")
        logger.info(f"Reports text length: {len(reports_text)} chars")
        
        try:
            converse_kwargs = {
                'modelId': BEDROCK_MODEL_ID,
                'messages': [{
                    "role": "user",
                    "content": [{"text": prompt}]
                }],
                'inferenceConfig': {
                    "maxTokens": 4000,
                    "temperature": 0.05,
                },
            }
            if GUARDRAIL_ID and GUARDRAIL_VERSION:
                converse_kwargs['guardrailConfig'] = {
                    'guardrailIdentifier': GUARDRAIL_ID,
                    'guardrailVersion': GUARDRAIL_VERSION,
                }
            response = bedrock.converse(**converse_kwargs)

            patterns_json = response['output']['message']['content'][0]['text']
            logger.info(f"Patterns JSON length: {len(patterns_json)}")
            logger.info(f"Patterns JSON preview: {patterns_json[:500]}")
            
            # Remove markdown code blocks if present
            if patterns_json.strip().startswith('```'):
                patterns_json = patterns_json.strip()
                # Find the JSON content between code fences
                lines = patterns_json.split('\n')
                json_lines = []
                in_code_block = False
                for line in lines:
                    if line.strip().startswith('```'):
                        in_code_block = not in_code_block
                        continue
                    if in_code_block:
                        json_lines.append(line)
                patterns_json = '\n'.join(json_lines)

            logger.info(f"Cleaned patterns JSON length: {len(patterns_json)}")
            
            # Parse JSON response
            try:
                patterns = json.loads(patterns_json)
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                logger.error(f"Problematic JSON preview: {patterns_json[max(0, e.pos-200):min(len(patterns_json), e.pos+200)]}")
                # Try to fix common issues
                patterns_json = patterns_json.replace('\u2192', '->')  # Replace arrow
                patterns_json = patterns_json.replace('\u2610', '[ ]')  # Replace checkbox
                patterns_json = patterns_json.replace('\u2191', '^')  # Replace up arrow
                patterns_json = patterns_json.replace('\u2190', '<-')  # Replace left arrow
                patterns = json.loads(patterns_json)
            
            # Store patterns in DynamoDB
            for pattern in patterns:
                # Create deterministic pattern ID to prevent duplicates
                # Format: PATTERN-{procedureCode}-{type}-{firstStep}
                first_step = pattern['affectedSteps'][0] if pattern['affectedSteps'] else 0
                pattern_id = f"PATTERN-{procedure_code}-{pattern['type']}-{first_step}"

                # Check if pattern already exists
                try:
                    existing = table.get_item(Key={'patternId': pattern_id})
                    if 'Item' in existing:
                        logger.info(f"Pattern already exists for {pattern_id}, skipping")
                        continue
                except Exception as e:
                    logger.error(f"Error checking existing pattern: {e}")

                item = {
                    'patternId': pattern_id,
                    'procedureCode': procedure_code,
                    'runbookId': runbook_id,
                    'type': pattern['type'],
                    'affectedSteps': pattern['affectedSteps'],
                    'stepTitles': pattern['stepTitles'],
                    'frequency': pattern['frequency'],
                    'severity': pattern['severity'],
                    'description': pattern['description'],
                    'rootCause': pattern['rootCause'],
                    'specificDeficiency': pattern['specificDeficiency'],
                    'reportIds': [r['reportId'] for r in reports],
                    'evidenceSummary': pattern['evidenceSummary'],
                    'safetyImpact': pattern.get('safetyImpact', ''),
                    'regulatoryConcern': pattern.get('regulatoryConcern', ''),
                    'humanFactorsAnalysis': pattern.get('humanFactorsAnalysis', ''),
                    'recommendedAction': pattern['recommendedAction'],
                    'status': 'new',
                    'rejectedBy': None,
                    'rejectionReason': None,
                    'rejectedAt': None,
                    'createdAt': datetime.now().isoformat(),
                    'analyzedBy': 'bedrock_claude_sonnet_4.5'
                }

                table.put_item(Item=item)
                all_patterns.append(item)
                
        except Exception as e:
            logger.exception(f"Error analyzing procedure {procedure_code}: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            continue
    
    return {
        'statusCode': 200,
        'patterns': all_patterns,
        'totalPatterns': len(all_patterns)
    }
