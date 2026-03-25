#!/usr/bin/env python3
"""
Test script for analysis prompt
Tests the improved prompt to ensure it filters out documentation issues
"""
import json
import boto3
from datetime import datetime

# Sample reports with both operational and documentation issues
SAMPLE_REPORTS = [
    {
        'report_id': 'test-report-1',
        'content': '''
# Maintenance Report - RCP-A

## Issues Encountered
- Torque wrench calibration expired (sticker shows 2025-12-15, today is 2026-01-15)
- Had to return to tool crib to get calibrated wrench
- Bolt numbering on flange unclear - no reference mark for bolt #1
- Wasted 10 minutes figuring out which bolt to start with

## Delays
- 35 minutes: Getting calibrated torque wrench
- 10 minutes: Figuring out bolt numbering
'''
    },
    {
        'report_id': 'test-report-2',
        'content': '''
# Maintenance Report - RCP-B

## Issues
- Another expired torque wrench in circulation (calibration 2025-11-20)
- Tool crib needs better tracking system
- Bolt numbering confusion again - need reference marks on flanges
- Form BTF-001 doesn't have columns for 3-pass torque documentation

## Time Lost
- 40 minutes getting proper wrench
- 10 minutes on bolt numbering
- 5 minutes creating handwritten torque table
'''
    },
    {
        'report_id': 'test-report-3',
        'content': '''
# Maintenance Report - Valve A102

## Problems
- Inspection camera battery was dead
- No charged spare batteries available
- Warehouse queue was 45 minutes long (only 1 person working)
- PI-302 pressure indicator not listed in required tools

## Delays
- 20 minutes: Finding charged camera battery
- 45 minutes: Warehouse queue
- 10 minutes: Getting PI-302 from tool crib
'''
    },
    {
        'report_id': 'test-report-4',
        'content': '''
# Maintenance Report - Valve C205

## Issues Encountered
- Camera battery dead again - this is recurring
- Warehouse severely understaffed (80 minute wait!)
- Badge reader at entrance failed - had to use manual sign-in
- Leak detection spray can was empty

## Time Impact
- 15 minutes: Camera battery
- 80 minutes: Warehouse queue
- 25 minutes: Badge reader failure
- 15 minutes: Getting new spray can
'''
    }
]

def build_prompt(reports):
    """Build the analysis prompt"""
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
    "issue_type": "tool|equipment|process|resource",
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
    
    return prompt

def test_prompt():
    """Test the prompt with Bedrock"""
    print("=" * 80)
    print("TESTING IMPROVED ANALYSIS PROMPT")
    print("=" * 80)
    print()
    
    # Build prompt
    prompt = build_prompt(SAMPLE_REPORTS)
    
    print("Sample reports contain:")
    print("  OPERATIONAL issues (should be included):")
    print("    - Expired torque wrench calibration (2 reports)")
    print("    - Dead camera batteries (2 reports)")
    print("    - Warehouse understaffed (2 reports)")
    print("    - Badge reader failures (1 report)")
    print("    - Empty spray can (1 report)")
    print()
    print("  DOCUMENTATION issues (should be EXCLUDED):")
    print("    - Bolt numbering unclear (2 reports)")
    print("    - Form BTF-001 missing columns (1 report)")
    print("    - PI-302 not in tools list (1 report)")
    print()
    print("-" * 80)
    print()
    
    # Call Bedrock
    bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-1')
    model_id = 'us.anthropic.claude-sonnet-4-20250514-v1:0'
    
    print(f"Calling Bedrock model: {model_id}")
    print()
    
    try:
        response = bedrock_client.converse(
            modelId=model_id,
            messages=[{
                "role": "user",
                "content": [{"text": prompt}]
            }],
            inferenceConfig={
                "maxTokens": 4096,
                "temperature": 0.3
            }
        )
        
        ai_response = response['output']['message']['content'][0]['text']
        
        # Parse JSON
        json_start = ai_response.find('[')
        json_end = ai_response.rfind(']') + 1
        
        if json_start == -1 or json_end == 0:
            print("❌ ERROR: No JSON found in response")
            print("Response:", ai_response)
            return
        
        insights = json.loads(ai_response[json_start:json_end])
        
        print("=" * 80)
        print(f"RESULTS: {len(insights)} insights generated")
        print("=" * 80)
        print()
        
        # Analyze results
        operational_count = 0
        documentation_count = 0
        
        for i, insight in enumerate(insights, 1):
            print(f"{i}. {insight['description']}")
            print(f"   Type: {insight['issue_type']}")
            print(f"   Frequency: {insight['frequency']} reports")
            print(f"   Action: {insight['recommended_action'][:80]}...")
            print()
            
            # Check if it's operational or documentation
            desc_lower = insight['description'].lower()
            action_lower = insight['recommended_action'].lower()
            
            # Documentation keywords
            doc_keywords = ['runbook', 'form', 'checklist', 'documentation', 'bolt numbering', 
                           'reference mark', 'add to list', 'update form', 'missing from list']
            
            is_doc_issue = any(kw in desc_lower or kw in action_lower for kw in doc_keywords)
            
            if is_doc_issue:
                documentation_count += 1
                print(f"   ⚠️  WARNING: This looks like a DOCUMENTATION issue!")
            else:
                operational_count += 1
                print(f"   ✅ OPERATIONAL issue (correct)")
            
            print()
        
        print("=" * 80)
        print("VALIDATION SUMMARY")
        print("=" * 80)
        print(f"✅ Operational issues: {operational_count}")
        print(f"❌ Documentation issues: {documentation_count}")
        print()
        
        if documentation_count == 0:
            print("🎉 SUCCESS: Prompt correctly filtered out all documentation issues!")
        else:
            print(f"⚠️  FAILURE: {documentation_count} documentation issue(s) still present")
            print("   The prompt needs further refinement.")
        
        print()
        print("Expected results:")
        print("  - Torque wrench calibration expired (tool)")
        print("  - Camera batteries dead (equipment)")
        print("  - Warehouse understaffed (resource)")
        print()
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_prompt()
