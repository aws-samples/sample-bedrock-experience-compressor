# Field Report: report-vlv-003-c205

**Report ID:** report-vlv-003-c205  
**Task ID:** task-20260129-022  
**Technician:** Carlos Rodriguez (tech-3104)  
**Runbook:** RB-VLV-003 v3.2  
**Location:** Building C, Primary Circuit Room 205  
**Date:** 2026-01-29

## Timing
- Started: 09:00
- Completed: 13:45
- Duration: 285 minutes (estimated: 240 minutes)

## Status
- Everything OK: No
- Had Delays: Yes
- Runbook Rating: 4/5 stars

## Step-Specific Feedback

### Step 1: Pre-Work Verification
- Issue: Checked all tools but torque wrench calibration not explicitly listed in Step 1 checklist
- Suggestion: Add explicit line: "☐ Torque wrench calibration valid (<12 months)" to Step 1 checklist
- Time Impact: 0 minutes (caught early thanks to Marie's report from yesterday)
- Safety Critical: Yes

**What Happened:**
Read Marie's report from yesterday before starting. She caught expired torque wrench at Step 7. I checked TW-0923 calibration in Step 1 - valid until 2026-08-15. Saved 45 minutes by catching early.

### Step 2: Depressurization Verification
- Issue: Secondary pressure indicator PI-302 not in my tool list initially
- Suggestion: Add PI-302 to Section 3 "Required Tools" list (currently missing)
- Time Impact: +10 minutes (had to go back to tool crib)
- Safety Critical: Yes

**What Happened:**
Step 2 mentions PI-302 but it's not in the Required Tools section (Section 3). Didn't know I needed it until I got to Step 2. Had to walk back to TC-3 to get it.

### Step 3: Flange Bolt Removal
- Issue: Same as Marie's report - bolt #1 position unclear on actual flange
- Suggestion: Paint white dot at 12 o'clock position on all flanges during next outage
- Time Impact: +5 minutes
- Safety Critical: No

### Step 7: Bolt Torquing
- Issue: Form BTF-001 doesn't have space for all 3 torque passes (only has one column)
- Suggestion: Update form BTF-001 to have 3 columns: Pass 1 (60 Nm), Pass 2 (120 Nm), Pass 3 (180 Nm)
- Time Impact: +10 minutes (had to create handwritten table)
- Safety Critical: No

**What Happened:**
Form BTF-001 only has one "Torque Value" column. Procedure requires 3 passes with different torques. Had to draw my own table on the back of the form to document all 3 passes properly.

### Step 8: Pressure Test
- Issue: Leak detection spray can half-empty (same issue as Marie's report)
- Suggestion: Add to Step 1: "☐ Leak detection spray can >50% full (shake to verify)"
- Time Impact: +15 minutes (got new can to be safe)
- Safety Critical: No

## Comments

**Positive:**
- Secondary pressure verification (Step 2) worked perfectly - caught 0.2 bar residual
- Torque sequence diagram very clear
- Procedure overall is well-structured

**Issues (Recurring from Marie's report):**
1. Torque wrench calibration check not in Step 1 checklist
2. PI-302 missing from Required Tools list (Section 3)
3. Bolt #1 position unclear on flange
4. Form BTF-001 needs 3 columns for 3 torque passes
5. Leak spray check not in Step 1

**Pattern I'm Seeing:**
This is the second report in 2 days with the same issues. These are easy fixes that would save 30-45 minutes per job:
- Add calibration checks to Step 1 checklist
- Add PI-302 to Required Tools
- Update Form BTF-001 for 3-pass torquing
- Add leak spray check to Step 1

**Results:**
- Pressure test passed (no leaks)
- Flow rate: 352 m³/h (within spec)
- New valve serial number: VLV-2026-0851
- All forms completed

**Learning from Previous Reports:**
Reading Marie's report saved me 45 minutes. This proves the value of sharing field experience. If these issues get fixed in the runbook, future techs will save even more time.

## Photos

![torque wrench with valid calibration check](../photos/2026/01/29/report-vlv-003-photo4.png)

![secondary pressure indicator PI-302 showing zero](../photos/2026/01/29/report-vlv-003-photo5.png)

![completed valve replacement installation](../photos/2026/01/29/report-vlv-003-photo6.png)