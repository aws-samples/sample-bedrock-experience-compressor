# Field Report: report-turb-003

**Report ID:** report-turb-003
**Task ID:** task-20260301-011
**Technician:** Carlos Rodriguez (tech-4109)
**Runbook:** RB-003 v4.0
**Location:** Turbine Building, IP Turbine Section
**Date:** 2026-03-01

## Timing
- Started: 08:00
- Completed: 14:15
- Duration: 375 minutes (estimated: 360 minutes)

## Status
- Everything OK: Yes
- Had Delays: No (minimal)
- Runbook Rating: 4/5 stars

## Step-Specific Feedback

### Step 1: Turbine Lockout
- Issue: None - lockout sequence clear
- Time Impact: 0 minutes
- Safety Critical: N/A

### Step 2: Casing Opening
- Issue: Casing bolts showed light corrosion (applied penetrating oil preventively per David's recommendation)
- Suggestion: Preventive oil application now standard practice based on previous reports
- Time Impact: +10 minutes (oil application, minimal delay)
- Safety Critical: No

**What Happened:**
Read David's (Jan 25) and Marie's (Feb 12) turbine reports before starting. Both documented bolt corrosion issues. David had severe corrosion (90 min delay), Marie had moderate corrosion (30 min delay).

Inspected IP turbine casing bolts - light corrosion visible on bottom half (condensation zone pattern). Applied penetrating oil preventively to all corroded bolts, waited 10 minutes before removal.

Result: All bolts removed smoothly, no seizure, no rounded heads. Small time investment (10 min) prevented potential major delays (30-90 min).

**Learning from reports works.** Preventive oil application should be documented in procedure.

### Step 3: Blade Visual Inspection
- Issue: Lighting improved (brought high-intensity LED light based on David and Marie's reports)
- Time Impact: 0 minutes (avoided problem by preparation)
- Safety Critical: N/A

**What Happened:**
David (Jan 25) and Marie (Feb 12) both reported inadequate lighting for blade root crack detection (standard 500-lumen lights insufficient). Both recommended minimum 1000-lumen LED articulating light.

Borrowed 1200-lumen LED work light before starting job. Excellent visibility for blade root inspection, no shadow problems. Proper lighting makes crack detection much easier and more reliable.

This should be specified in procedure equipment list (not subjective "adequate lighting").

### Step 4: PT/MT Inspection
- Issue: PT solution temperature checked preventively (learned from David's report)
- Time Impact: 0 minutes (avoided problem by pre-check)
- Safety Critical: N/A

### Step 6: Blade Tip Clearance
- Issue: Torque wrench calibration expired - discovered during feeler gauge verification
- Suggestion: Despite multiple reports, tool calibration issues continue
- Time Impact: +15 minutes (had backup wrench in truck)
- Safety Critical: Yes

**What Happened:**
Checking feeler gauges before blade clearance measurements. Noticed torque wrench calibration sticker: expired 2 weeks ago (due 2026-02-15, now March 1).

This is frustrating. Multiple reports document tool calibration issues:
- Mike (Jan 15, nuclear): +45 min
- Sarah (Jan 22, nuclear): +35 min
- Mark (Feb 8, wind): +40 min
- Marie (Feb 12, turbine): +25 min
- This report: +15 min (but only because I had backup wrench in truck)

Average delay: 32 minutes per incident. Six incidents now = 192 minutes total site-wide (Jan-Mar).

**Why is this still happening?** Multiple reports have highlighted this issue. Tool room has not implemented systematic calibration verification at tool issue.

Fortunately, I had backup torque wrench in my personal tool kit (calibration valid until 2026-09-20). Used backup wrench, lost only 15 minutes. If no backup available, would have lost 45+ minutes retrieving calibrated wrench.

**This is systemic tool management failure.** Needs operations manager escalation.

### Step 7: Casing Closure
- Issue: None - closure went smoothly
- Time Impact: 0 minutes
- Safety Critical: N/A

## Comments

**Learning Curve - Cross-Technician Knowledge Transfer:**
Read previous turbine reports (David, Marie) before starting. Applied their lessons:
- Preventive oil on corroded bolts (David's lesson): saved 20-80 min
- High-intensity lighting for inspection (David/Marie's lesson): saved 20-35 min
- PT temperature pre-check (David's lesson): saved 15 min

Total time saved by learning from reports: ~55-130 minutes. Job completed near estimated time (15 min over) despite tool calibration issue.

**Demonstrates value of report-based learning.** Techs who read and apply previous reports work more efficiently. Suggests need for systematic report review process (pre-job briefing).

**Tool Calibration - Persistent Issue:**
Sixth report documenting expired tool calibration. This is unacceptable pattern:
1. Multiple technicians reporting same issue (not individual failure)
2. Average 32-minute delay per incident
3. Total 192 minutes wasted site-wide (3+ hours of labor cost)
4. Safety risk (using uncalibrated tools on critical equipment)

**Root Cause:** Tool room does not verify calibration at tool issue. Expired tools available for checkout. No visual flag system (red tags?) to identify expired tools.

**Solution Required:**
- Immediate: Visual flag system for expired calibrations (remove from circulation)
- Short-term: Calibration verification checklist at tool issue window
- Long-term: Automated tracking system (barcode scan = calibration status)

**This should be escalated to operations manager.** Tool room supervisor needs directive to implement solution immediately.

**Positive:**
- Blade condition excellent (no cracks detected, all dimensional checks passed)
- PT/MT inspection clean (proper temperature, good lighting)
- Casing alignment perfect
- Vibration baseline excellent: 2.9 mm/s
- Learning from previous reports demonstrably effective

**Results:**
- All 56 blades inspected (IP turbine first stage)
- Zero cracks detected (PT/MT inspection clean)
- Blade tip clearance: 0.95 mm (spec 0.8-1.2 mm, acceptable)
- All dimensional checks within tolerance
- Casing closed and sealed successfully
- Torquing completed with calibrated backup wrench
- Vibration: 2.9 mm/s (within spec)

**Recommendations:**
1. Add preventive oil application to procedure (light corrosion = apply oil before removal)
2. Specify lighting requirement explicitly: "LED work light minimum 1000 lumens with articulating head"
3. Add PT solution temperature check to procedure: "Verify 15-30°C before application"
4. **ESCALATE TOOL CALIBRATION ISSUE TO OPERATIONS MANAGER** (systemic failure, six reports, 192 min lost)
5. Implement visual flag system for expired tool calibrations (immediate action required)
6. Continue pre-job report review practice (demonstrably reduces delays)

## Photos

![Light corrosion on casing bolts with preventive oil application](../photos/2026/03/01/report-turb-003-photo1.png)

![High-intensity LED lighting for blade root inspection](../photos/2026/03/01/report-turb-003-photo2.png)

![Expired torque wrench calibration sticker (2 weeks overdue)](../photos/2026/03/01/report-turb-003-photo3.png)

![Backup calibrated torque wrench from personal tool kit](../photos/2026/03/01/report-turb-003-photo4.png)
