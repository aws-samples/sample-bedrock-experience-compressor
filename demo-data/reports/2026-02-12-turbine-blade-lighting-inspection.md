# Field Report: report-turb-002

**Report ID:** report-turb-002
**Task ID:** task-20260212-005
**Technician:** Ana Carolina Silva (tech-2908)
**Runbook:** RB-003 v4.0
**Location:** Turbine Building, LP Turbine Section
**Date:** 2026-02-12

## Timing
- Started: 08:00
- Completed: 15:45
- Duration: 465 minutes (estimated: 360 minutes)

## Status
- Everything OK: No
- Had Delays: Yes
- Runbook Rating: 3/5 stars

## Step-Specific Feedback

### Step 2: Casing Opening
- Issue: Casing bolts showed moderate corrosion but not as severe as David's report (Jan 25)
- Suggestion: Same as David recommended - apply penetrating oil preventively if any corrosion visible
- Time Impact: +30 minutes (6 bolts required extra time due to corrosion)
- Safety Critical: No

**What Happened:**
Read David's report (report-turb-001, Jan 25) before starting. He had severe bolt corrosion (6 of 24 bolts severely stuck, one bolt head rounded). Expected similar issues.

LP turbine bolts in better condition than David's HP turbine, but still corroded (same moisture condensation pattern on bottom half). Applied penetrating oil preventively to all bottom-half bolts before removal attempt. This helped - bolts came out with moderate effort, no catastrophic seizure like David experienced.

David's recommendation to apply oil preventively is good practice. Saved time vs. fighting seized bolts.

### Step 3: Blade Visual Inspection
- Issue: Lighting inadequate for crack detection - SAME issue David reported
- Suggestion: Add to required equipment: "LED work light minimum 1000 lumens with articulating head for shadow-free inspection"
- Time Impact: +35 minutes (struggled with poor lighting, finally got better light)
- Safety Critical: Yes

**What Happened:**
This is second report of inadequate lighting on turbine blade inspection. David (Jan 25) reported same issue - standard 500-lumen work lights insufficient for blade root crack detection.

Started inspection with standard work light. Could not see blade root attachment area clearly (deep shadows, dark metal, complex geometry). Crack detection impossible with these conditions.

Remembered David's report - he borrowed 1200-lumen LED light from another crew. Asked around, found similar high-intensity light in shop. Brought it to turbine - MUCH better visibility. Can see blade root details clearly with bright articulated light.

**Problem:** Procedure says "adequate lighting" but doesn't specify lumens or type. What's "adequate" is subjective. For crack detection on dark metal in complex geometry, need minimum 1000 lumens with articulating head to eliminate shadows.

**This is safety-critical.** Missing crack during inspection = potential blade failure during operation = catastrophic turbine damage + safety risk.

**Recommendation:** Update required equipment list with specific lighting specification. Remove subjective "adequate" language.

### Step 4: PT/MT Inspection
- Issue: PT solution temperature acceptable this time (checked after reading David's report)
- Time Impact: 0 minutes (avoided problem by pre-checking)
- Safety Critical: N/A

**What Happened:**
David's report (Jan 25) mentioned PT solution too cold (12°C, below optimal 15-30°C). Checked PT solution temperature before starting - 14°C (borderline). Moved PT kit to warmer area, waited 15 minutes, rechecked - 18°C (acceptable).

Small time investment (15 min) prevented potential rework if inspection done at wrong temperature. Learning from previous reports helps avoid repeated mistakes.

### Step 5: Dimensional Checks
- Issue: Micrometer calibration expired (discovered during setup)
- Suggestion: Add to Step 1 checklist: "☐ Measurement tool calibration valid (micrometer, calipers, feeler gauges)"
- Time Impact: +25 minutes (retrieved calibrated micrometer from another crew)
- Safety Critical: Yes

**What Happened:**
Starting dimensional checks on blade tip thickness. Set up micrometer, checked calibration sticker - expired 3 months ago (due 2025-11-15, now Feb 2026). Cannot use expired measuring tools for quality-critical dimensions.

Another tool calibration issue. This is becoming a pattern across site:
- Mike (Jan 15, nuclear): Torque wrench expired +45 min
- Sarah (Jan 22, nuclear): Multimeter expired +35 min
- Mark (Feb 8, wind): Torque wrench expired +40 min
- This report: Micrometer expired +25 min

Average delay: 36 minutes per incident. This is systemic tool management problem, not individual technician errors.

Retrieved calibrated micrometer from nearby turbine crew (they had spare). Lost 25 minutes but could have been worse (if no spare available, would need to get from tool crib - possibly 60+ minutes).

## Comments

**Lighting Specification Needed:**
Second turbine blade inspection with inadequate lighting. David reported this on HP turbine (Jan 25), now same issue on LP turbine. This is safety-critical gap in procedure.

Crack detection requires specific lighting conditions:
- Minimum 1000 lumens intensity
- Articulating head to eliminate shadows
- LED type for white light (better color rendering than halogen)

"Adequate lighting" is not sufficient specification. Must be explicit.

**Tool Calibration - Site-Wide Issue:**
Fourth report documenting expired tool calibration. Pattern clear:
- Affecting multiple sectors (nuclear, wind, thermal)
- Affecting multiple tool types (torque wrenches, multimeters, micrometers)
- Average delay: 36 minutes per incident
- Root cause: No verification at tool issue, expired tools not flagged

This is operational inefficiency costing significant time. Simple solution: visual flag on expired tools (red tag?), verification checklist at tool crib issue.

**Learning From Reports:**
Reading previous reports saved time on this job:
- David's bolt corrosion experience: applied oil preventively, avoided worst delays
- David's lighting issue: knew to get better light immediately
- David's PT temperature issue: checked temperature before starting, avoided rework

This demonstrates value of report sharing and learning across technicians. Suggests need for formal report review system (brief techs on recent issues before similar work).

**Positive:**
- Blade condition excellent (no cracks detected)
- PT/MT inspection effective with proper temperature control
- Dimensional checks all within tolerance
- Casing realignment successful
- Team coordination smooth

**Results:**
- All 64 blades inspected (LP turbine first stage)
- Zero cracks detected (PT/MT inspection clean)
- Blade tip clearance: 1.1 mm (spec 0.8-1.5 mm, acceptable)
- All dimensional checks within tolerance
- Casing closed and sealed successfully
- Vibration baseline established: 3.4 mm/s (within spec)

**Recommendations:**
1. Update required equipment: specify "LED work light minimum 1000 lumens with articulating head"
2. Add tool calibration verification to Step 1 checklist (all measuring tools)
3. Implement tool room red tag system for expired calibrations
4. Consider pre-job briefing system (review recent reports for similar work)
5. Continue bolt corrosion monitoring (preventive oil application effective)

## Photos

![Standard lighting vs high-intensity LED comparison on blade roots](../photos/2026/02/12/report-turb-002-photo1.png)

![Blade root crack detection area with proper 1200-lumen lighting](../photos/2026/02/12/report-turb-002-photo2.png)

![Expired micrometer calibration sticker (3 months overdue)](../photos/2026/02/12/report-turb-002-photo3.png)

![PT inspection showing clean blade surfaces (no cracks)](../photos/2026/02/12/report-turb-002-photo4.png)
