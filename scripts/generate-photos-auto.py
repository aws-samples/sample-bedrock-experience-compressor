#!/usr/bin/env python3
"""
Automatic Photo Generator for All Demo Reports
Intelligently generates photos based on actual report content using Amazon Bedrock Nova Canvas.

This script:
1. Scans all 30 field reports
2. Extracts issues/problems from Step-Specific Feedback sections
3. Generates contextual photo prompts based on actual report content
4. Follows strict naming convention: {report-id}-photo{N}.png
5. Organizes by date: photos/{YYYY}/{MM}/{DD}/

Frontend can then automatically construct photo URLs from report metadata.
"""

import boto3
import json
import base64
import os
import re
from pathlib import Path
from datetime import datetime

# Initialize Bedrock client
bedrock = boto3.client('bedrock-runtime')

# Model configuration
MODEL_ID = "amazon.nova-canvas-v1:0"
RESOLUTION = "1024x768"


def parse_report_file(filepath):
    """Extract metadata and issues from a field report."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract Report ID
    report_id_match = re.search(r'\*\*Report ID:\*\* (.+?)(?:\s|$)', content)
    report_id = report_id_match.group(1).strip() if report_id_match else None

    # Extract Date
    date_match = re.search(r'\*\*Date:\*\* (\d{4}-\d{2}-\d{2})', content)
    date_str = date_match.group(1) if date_match else None

    # Extract Runbook
    runbook_match = re.search(r'\*\*Runbook:\*\* (.+?)(?:\s|$)', content)
    runbook = runbook_match.group(1).strip() if runbook_match else None

    # Extract Location
    location_match = re.search(r'\*\*Location:\*\* (.+?)(?:\n|$)', content)
    location = location_match.group(1).strip() if location_match else "Industrial facility"

    # Extract Step-Specific Feedback issues
    issues = []
    feedback_section = re.search(r'## Step-Specific Feedback(.+?)(?=^##\s|\Z)', content, re.DOTALL | re.MULTILINE)
    if feedback_section:
        feedback_text = feedback_section.group(1)
        # Find all "- Issue:" lines (can be multiline if wrapped)
        issue_matches = re.finditer(r'^- Issue:\s*(.+?)$', feedback_text, re.MULTILINE)
        for match in issue_matches:
            issue_text = match.group(1).strip()
            # Some issues span multiple lines, capture until next "- " item
            issues.append(issue_text)

    # Extract general comments for context
    comments_section = re.search(r'## Comments(.+?)(?=##|$)', content, re.DOTALL)
    comments = comments_section.group(1).strip() if comments_section else ""

    return {
        'filepath': filepath,
        'filename': os.path.basename(filepath),
        'report_id': report_id,
        'date': date_str,
        'runbook': runbook,
        'location': location,
        'issues': issues,
        'comments': comments[:500]  # First 500 chars for context
    }


def determine_sector_from_runbook(runbook):
    """Determine energy sector from runbook ID."""
    if not runbook:
        return "industrial"
    runbook_upper = runbook.upper()
    if 'WIND' in runbook_upper:
        return "wind_turbine"
    elif 'SOLAR' in runbook_upper:
        return "solar"
    elif 'HYDRO' in runbook_upper:
        return "hydro"
    elif 'THERMAL' in runbook_upper or 'HX' in runbook_upper:
        return "thermal"
    else:
        return "nuclear"


def generate_photo_prompts(report_data, max_photos=3):
    """Generate photo prompts based on actual report issues."""
    prompts = []
    report_id = report_data['report_id']
    issues = report_data['issues']
    location = report_data['location']
    sector = determine_sector_from_runbook(report_data['runbook'])

    # Base context by sector
    sector_contexts = {
        'nuclear': "nuclear power plant maintenance area",
        'wind_turbine': "wind turbine nacelle or tower maintenance area",
        'solar': "solar power plant inverter room or panel field",
        'hydro': "hydroelectric power plant turbine hall",
        'thermal': "thermal power plant or industrial facility",
        'industrial': "industrial maintenance facility"
    }
    base_context = sector_contexts.get(sector, sector_contexts['industrial'])

    # Generate prompts for top issues
    for idx, issue in enumerate(issues[:max_photos]):
        issue_lower = issue.lower()

        # Calibration issues
        if 'calibration' in issue_lower and ('expired' in issue_lower or 'expir' in issue_lower):
            if 'torque' in issue_lower or 'wrench' in issue_lower:
                prompt = f"Close-up photo of an industrial torque wrench with an expired red calibration sticker. The sticker shows a past due date. Tool is on a metal workbench in a {base_context}. Realistic industrial photography, sharp focus on calibration tag."
            elif 'gauge' in issue_lower or 'manometer' in issue_lower:
                prompt = f"Industrial pressure gauge with expired calibration tag visible. Red 'EXPIRED' or 'CALIBRATION DUE' label clearly shown. Mounted in a {base_context}. Professional technical photography."
            elif 'multimeter' in issue_lower:
                prompt = f"Digital multimeter with expired calibration sticker on the device. Tool placed on maintenance bench in a {base_context}. Realistic equipment photography."
            else:
                prompt = f"Industrial measuring instrument with expired calibration sticker prominently displayed. Red or yellow warning tag visible. Located in a {base_context}. Technical documentation photography."

        # Battery issues
        elif 'battery' in issue_lower or 'power' in issue_lower:
            if 'thermal' in issue_lower or 'camera' in issue_lower:
                prompt = f"Industrial thermal imaging camera showing low battery warning on LCD display. Battery indicator at critical level. Device in a {base_context}. Close-up product photography."
            else:
                prompt = f"Industrial electronic device displaying low battery warning or dead battery indicator. Screen showing power issue. Equipment in a {base_context}. Technical photography."

        # Stuck/seized equipment
        elif 'stuck' in issue_lower or 'seized' in issue_lower or 'grip' in issue_lower:
            if 'impeller' in issue_lower or 'pump' in issue_lower:
                prompt = f"Large industrial pump impeller stuck on shaft, showing corrosion and crystallized deposits. Heavy industrial equipment in maintenance workshop of a {base_context}. Detailed maintenance photography."
            elif 'valve' in issue_lower:
                prompt = f"Industrial valve handwheel seized or difficult to operate, with visible corrosion. Valve mounted on piping system in a {base_context}. Technical maintenance photography."
            elif 'filter' in issue_lower:
                prompt = f"Industrial filter housing seized or corroded, wrench marks visible from forced opening. Equipment in a {base_context}. Realistic maintenance photography."
            else:
                prompt = f"Seized or stuck industrial equipment component showing corrosion or deposits. Maintenance tools nearby attempting to free the component. Located in a {base_context}. Realistic field photography."

        # Corrosion/deterioration
        elif 'corrosion' in issue_lower or 'rust' in issue_lower or 'corroded' in issue_lower:
            if 'bolt' in issue_lower or 'fastener' in issue_lower:
                prompt = f"Corroded industrial bolts on heavy equipment flange or casing. Rust and oxidation visible on fasteners. Component in a {base_context}. Close-up technical photography."
            else:
                prompt = f"Corroded industrial component showing significant rust and oxidation. Equipment degradation visible. Located in a {base_context}. Maintenance documentation photography."

        # Lighting issues
        elif 'light' in issue_lower or 'lighting' in issue_lower or 'visibility' in issue_lower:
            prompt = f"Dimly lit industrial equipment inspection area showing inadequate lighting conditions. Inspector's flashlight illuminating components in a {base_context}. Atmospheric industrial photography."

        # Leaks/fluid issues
        elif 'leak' in issue_lower or 'fluid' in issue_lower or 'oil' in issue_lower:
            prompt = f"Industrial equipment showing signs of fluid leak or oil seepage. Staining or residue visible on component surface. Equipment in a {base_context}. Maintenance inspection photography."

        # Dust/contamination
        elif 'dust' in issue_lower or 'dirt' in issue_lower or 'contamination' in issue_lower:
            if 'inverter' in issue_lower or 'electronic' in issue_lower:
                prompt = f"Industrial inverter or electronic equipment interior showing heavy dust accumulation on components. Cooling fins caked with dust. Equipment in a {base_context}. Close-up technical photography."
            else:
                prompt = f"Industrial equipment covered with dust or contamination. Surface showing buildup requiring cleaning. Located in a {base_context}. Maintenance documentation photography."

        # Erosion (wind turbines)
        elif 'erosion' in issue_lower or 'eroded' in issue_lower:
            if sector == 'wind_turbine':
                prompt = f"Wind turbine blade leading edge showing erosion damage. Surface degradation and material loss visible. Close-up of blade surface during maintenance. Realistic wind energy maintenance photography."
            else:
                prompt = f"Industrial component showing erosion or wear damage. Surface degradation visible. Equipment in a {base_context}. Technical inspection photography."

        # LOTO/safety issues
        elif 'loto' in issue_lower or 'lockout' in issue_lower or 'safety' in issue_lower:
            prompt = f"Industrial equipment with lockout-tagout (LOTO) devices attached. Red safety locks and tags visible on electrical panel or valve. Located in a {base_context}. Safety compliance photography."

        # Gasket/seal issues
        elif 'gasket' in issue_lower or 'seal' in issue_lower:
            prompt = f"Industrial flange gasket replacement in progress. Old gasket removed showing wear or damage. New gasket ready for installation. Equipment in a {base_context}. Maintenance procedure photography."

        # Access/scaffolding issues
        elif 'access' in issue_lower or 'scaffold' in issue_lower or 'ladder' in issue_lower:
            if 'ice' in issue_lower or 'icing' in issue_lower:
                prompt = f"Iced-over ladder or access platform on industrial equipment. Ice buildup creating hazardous conditions. Cold weather maintenance environment at a {base_context}. Safety documentation photography."
            else:
                prompt = f"Industrial scaffolding or access platform installed around large equipment for maintenance. Workers' safety equipment visible. Located in a {base_context}. Site condition photography."

        # Torque/tightening issues
        elif 'torque' in issue_lower or 'tighten' in issue_lower or 'bolt' in issue_lower:
            prompt = f"Industrial bolt pattern on flange or casing showing torque sequence numbers. Star pattern or numbered bolts visible. Equipment in a {base_context}. Technical procedure photography."

        # Silt/sediment (hydro)
        elif 'silt' in issue_lower or 'sediment' in issue_lower:
            prompt = f"Heavy silt or sediment accumulation in hydroelectric turbine area. Thick layer of mud or deposits visible. Dewatered turbine chamber in a {base_context}. Industrial cleaning documentation."

        # Generic fallback based on equipment type
        elif 'pump' in issue_lower:
            prompt = f"Industrial pump component during maintenance showing the reported issue. Equipment disassembled in a {base_context}. Technical maintenance photography."
        elif 'valve' in issue_lower:
            prompt = f"Industrial valve during maintenance showing the reported issue. Valve components visible in a {base_context}. Technical equipment photography."
        elif 'turbine' in issue_lower or 'blade' in issue_lower:
            prompt = f"Turbine blade or component inspection showing the reported issue. Equipment in a {base_context}. Technical inspection photography."
        else:
            # Most generic fallback
            prompt = f"Industrial maintenance equipment showing signs of wear or the reported issue: {issue[:100]}. Equipment in a {base_context}. Realistic maintenance documentation photography."

        prompts.append({
            'filename': f"{report_id}-photo{idx + 1}.png",
            'prompt': prompt,
            'negative_prompt': "cartoon, illustration, drawing, animated, people's faces, text, watermark, low quality",
            'issue': issue
        })

    return prompts


def generate_image_with_bedrock(prompt, negative_prompt):
    """Generate image using Amazon Nova Canvas."""
    try:
        body = json.dumps({
            "taskType": "TEXT_IMAGE",
            "textToImageParams": {
                "text": prompt,
                "negativeText": negative_prompt
            },
            "imageGenerationConfig": {
                "numberOfImages": 1,
                "quality": "premium",
                "height": 768,
                "width": 1024,
                "cfgScale": 8.0,
                "seed": 42
            }
        })

        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            body=body
        )

        response_body = json.loads(response['body'].read())

        if 'images' in response_body and len(response_body['images']) > 0:
            image_data = response_body['images'][0]
            return base64.b64decode(image_data)
        else:
            print(f"Warning: No image in response for prompt: {prompt[:100]}")
            return None

    except Exception as e:
        print(f"Error generating image: {e}")
        return None


def save_image(image_data, output_path):
    """Save image data to file."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(image_data)


def main():
    """Main execution function."""
    print("🎨 Automatic Photo Generator for Demo Reports")
    print("=" * 60)
    print()

    # Scan all report files
    reports_dir = Path(__file__).parent.parent / "demo-data" / "reports"
    report_files = sorted(reports_dir.glob("*.md"))

    print(f"📋 Found {len(report_files)} reports to process")
    print()

    # Ask user which reports to process
    print("Options:")
    print("  1. Generate photos for ALL reports (30 reports, ~90 photos, ~$3.60)")
    print("  2. Generate photos for NEW reports only (24 reports, ~72 photos, ~$2.88)")
    print("  3. Generate photos for specific date range")
    print("  4. Dry run (show what would be generated, no API calls)")
    print()

    choice = input("Select option (1-4): ").strip()

    if choice == '4':
        dry_run = True
        print("\n🔍 DRY RUN MODE - No images will be generated\n")
    else:
        dry_run = False

    # Filter reports based on choice
    if choice == '2':
        # Only process reports from Feb-Mar 2026 (new realistic reports)
        report_files = [f for f in report_files if '2026-02-' in f.name or '2026-03-' in f.name]
        print(f"\n📝 Processing {len(report_files)} new reports (Feb-Mar 2026)\n")
    elif choice == '3':
        start_date = input("Start date (YYYY-MM-DD): ").strip()
        end_date = input("End date (YYYY-MM-DD): ").strip()
        report_files = [f for f in report_files
                       if start_date <= f.name[:10] <= end_date]
        print(f"\n📝 Processing {len(report_files)} reports in date range\n")

    # Process each report
    total_photos = 0
    generated_count = 0

    for report_file in report_files:
        print(f"Processing: {report_file.name}")

        # Parse report
        report_data = parse_report_file(report_file)

        if not report_data['report_id']:
            print(f"  ⚠️  Warning: No Report ID found, skipping")
            continue

        if not report_data['date']:
            print(f"  ⚠️  Warning: No date found, skipping")
            continue

        # Extract date components
        date_obj = datetime.strptime(report_data['date'], '%Y-%m-%d')
        year = date_obj.strftime('%Y')
        month = date_obj.strftime('%m')
        day = date_obj.strftime('%d')

        # Generate photo prompts based on issues
        photo_specs = generate_photo_prompts(report_data, max_photos=3)

        if not photo_specs:
            print(f"  ℹ️  No significant issues found for photo generation")
            continue

        print(f"  Report ID: {report_data['report_id']}")
        print(f"  Date: {report_data['date']}")
        print(f"  Photos to generate: {len(photo_specs)}")

        # Create output directory
        output_dir = Path(__file__).parent.parent / "demo-data" / "photos" / year / month / day

        # Generate each photo
        for spec in photo_specs:
            filename = spec['filename']
            output_path = output_dir / filename

            print(f"    → {filename}")
            print(f"       Issue: {spec['issue'][:80]}...")

            if dry_run:
                print(f"       Prompt: {spec['prompt'][:100]}...")
                print(f"       Would save to: {output_path}")
                total_photos += 1
            else:
                # Check if file already exists
                if output_path.exists():
                    print(f"       ℹ️  Already exists, skipping")
                    total_photos += 1
                    continue

                # Generate image
                print(f"       🎨 Generating with Bedrock...")
                image_data = generate_image_with_bedrock(spec['prompt'], spec['negative_prompt'])

                if image_data:
                    save_image(image_data, output_path)
                    print(f"       ✅ Saved to: {output_path}")
                    generated_count += 1
                    total_photos += 1
                else:
                    print(f"       ❌ Failed to generate")

        print()

    # Summary
    print("=" * 60)
    print("📊 Summary")
    print("=" * 60)
    print(f"Reports processed: {len(report_files)}")
    print(f"Total photos: {total_photos}")
    if not dry_run:
        print(f"Newly generated: {generated_count}")
        print(f"Already existed: {total_photos - generated_count}")
        print(f"Estimated cost: ${total_photos * 0.04:.2f}")
    print()
    print("✅ Photo generation complete!")
    print()
    print("📤 Next steps:")
    print("  1. Review generated photos in demo-data/photos/")
    print("  2. Upload to S3:")
    print("     aws s3 sync demo-data/photos/ s3://xp-compressor-photos-ACCOUNT/ --recursive")
    print("  3. Photos will be automatically accessible in frontend via:")
    print("     photos/{YYYY}/{MM}/{DD}/{report-id}-photo{N}.png")
    print()


if __name__ == "__main__":
    main()
