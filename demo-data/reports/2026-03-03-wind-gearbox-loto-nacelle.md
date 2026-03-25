# Field Report: report-wind-gb-003

**Report ID:** report-wind-gb-003
**Task ID:** task-20260303-012
**Technician:** Lisa Kumar (tech-5201)
**Runbook:** RB-WIND-001 v3.0
**Location:** Wind Farm Site 1, Turbine WT-05
**Date:** 2026-03-03

## Timing
- Started: 07:30
- Completed: 13:15
- Duration: 345 minutes (estimated: 300 minutes)

## Status
- Everything OK: No
- Had Delays: Yes
- Runbook Rating: 3/5 stars

## Step-Specific Feedback

### Step 1: Turbine Shutdown and LOTO
- Issue: LOTO sequence still unclear despite previous reports (Jennifer, Mark)
- Suggestion: Add explicit sequence to procedure - cannot rely on verbal knowledge
- Time Impact: +20 minutes (called supervisor, same issue as previous reports)
- Safety Critical: Yes

**What Happened:**
This is my first wind turbine gearbox oil change. Read Jennifer's (Jan 18) and Mark's (Feb 8) reports before starting. Both documented LOTO sequence confusion when multiple energy sources present.

Started LOTO process. Electrical isolation obvious (breaker + disconnect). Then confused: hydraulic brake system or pneumatic actuators next? Compressed air energy in pneumatic system could cause unexpected valve movement if released wrong time.

Called supervisor for clarification. He confirmed sequence: electrical → hydraulic → pneumatic → mechanical rotation lock. Same sequence Jennifer and Mark needed clarified.

**This is third report highlighting LOTO sequence issue.** Pattern clear: procedure assumes techs "know" the sequence, but new techs don't know, cross-trained techs don't know. This is safety-critical information - must be explicit in procedure.

Jennifer reported this 45 days ago (Jan 18). Mark reported 23 days ago (Feb 8). Why is procedure still not updated? This is safety documentation gap.

### Step 2: Nacelle Access
- Issue: Ladder ice buildup (same as Jennifer's report in January)
- Suggestion: Weather precaution already documented in Jennifer's report - should be in procedure
- Time Impact: +15 minutes (de-iced ladder with scraper)
- Safety Critical: Yes

**What Happened:**
Temperature 1°C, frost on all metal surfaces. Nacelle access ladder had ice on rungs (Jennifer documented this issue Jan 18 at -5°C). Inspected ladder before climbing - 3 rungs with ice buildup.

De-iced ladder using scraper and hot air (portable heater). Verified all rungs clear before climbing. Lost 15 minutes but prevented fall risk.

Jennifer's recommendation correct: "Below 0°C, inspect ladder for ice before climbing." Should be added to Step 2 as weather precaution.

### Step 3: Oil Drain
- Issue: Oil viscosity high in cold nacelle (5°C) - drain slower than expected
- Suggestion: Add pre-heating guidance for cold weather (Jennifer's lesson)
- Time Impact: +25 minutes (slow drain due to cold oil)
- Safety Critical: No

**What Happened:**
Nacelle temperature 5°C (cold morning, turbine idle overnight). Started oil drain - flow rate approximately 4 L/min (expected 8 L/min for normal temperature). Gearbox holds 180 liters, drain took 45 minutes instead of planned 25 minutes (+20 minutes).

Jennifer's report (Jan 18) documented same issue at -5°C. Her recommendation: "Below 5°C nacelle temp, warm gearbox with heater 30 min before drain." Correct recommendation - pre-heating would have saved time vs. slow drain.

### Step 4: Filter Replacement
- Issue: Filter housing moderate resistance (learned from Mark's report, applied oil preventively)
- Suggestion: Mark's recommendation about O-ring replacement should be in procedure
- Time Impact: +10 minutes (preventive oil application, smooth removal)
- Safety Critical: No

**What Happened:**
Mark's report (Feb 8) described severely seized filter housing (65 min delay). His root cause analysis: O-ring degradation causing seizure. His recommendation: replace filter housing O-ring every 12 months.

Applied penetrating oil to filter housing before removal attempt (learned from Mark's experience). Waited 10 minutes. Housing removed with moderate torque (approximately 100 Nm), no seizure.

Inspected O-ring after removal - showing early hardening (18 months old per maintenance log). Replaced O-ring preventively (new O-ring installed with fresh filter).

Mark's analysis correct: O-ring degradation causes housing seizure. Preventive replacement every 12 months will avoid seizure issues.

### Step 5: Oil Fill and Circulation
- Issue: None - oil fill went smoothly
- Time Impact: 0 minutes
- Safety Critical: N/A

### Step 6: Vibration Baseline
- Issue: Torque wrench calibration expired (AGAIN)
- Suggestion: This is seventh report with calibration issue - SYSTEMIC FAILURE
- Time Impact: +15 minutes (site office 8 km away, retrieved calibrated wrench)
- Safety Critical: Yes

**What Happened:**
Completing oil fill, ready to torque fill plug. Checked torque wrench calibration - expired 1 month ago (due 2026-02-01, now March 3).

**This is SEVENTH report documenting expired tool calibration:**
1. Mike (Jan 15, nuclear): +45 min
2. Sarah (Jan 22, nuclear): +35 min
3. Mark (Feb 8, wind): +40 min
4. Marie (Feb 12, turbine): +25 min
5. Carlos (Mar 1, turbine): +15 min
6. This report: +15 min
7. (Plus others I may not have read)

Average delay: 29 minutes per incident. Seven incidents = 203 minutes total (3.4 hours).

**Why is this STILL happening?** Multiple reports since January. Tool room has not fixed the process. This is unacceptable safety and quality failure.

Sent helper to site office for calibrated wrench (8 km, 15 min round trip). If weather had been worse or site office closed, delay could have been 60+ minutes.

**This needs immediate management escalation.** Tool calibration verification must be implemented at tool room checkout.

## Comments

**LOTO Sequence - Safety Critical Gap:**
Third wind turbine report highlighting LOTO sequence confusion (Jennifer, Mark, now this report). 45 days since first report, issue not resolved in procedure.

**This is safety-critical documentation failure.** LOTO sequence affects multiple energy sources - wrong sequence could cause injury or equipment damage. Cannot rely on "everyone knows" - must be explicit.

**Pattern across sectors:** Thomas (Feb 10, nuclear RCP) also reported LOTO confusion with multiple energy sources. This is cross-sector issue affecting wind + nuclear procedures.

**Immediate action required:** Add explicit LOTO sequence to all procedures with multiple energy sources. Format:
```
LOTO Sequence (follow in order):
☐ 1. Electrical isolation (breaker + disconnect)
☐ 2. Hydraulic pressure release (accumulator depressurization)
☐ 3. Pneumatic isolation (compressed air supply valves)
☐ 4. Mechanical rotation lock (engage before maintenance)
☐ Verify zero energy on all sources before proceeding
```

**Tool Calibration - Escalation Required:**
Seventh report documenting expired calibration. This is beyond "process improvement suggestion" - this is systemic quality/safety failure requiring management intervention.

**Impact:**
- 203 minutes lost (7 incidents x 29 min average)
- Safety risk (uncalibrated tools on critical equipment)
- Quality risk (incorrect torque = failures, leaks, safety issues)
- Technician frustration (repeated same problem)

**Root cause:** Tool room has no calibration verification process at checkout. Expired tools available for issue.

**Solution:** Operations manager must direct tool room supervisor to implement immediate fixes:
1. Remove all expired tools from circulation (red tag + quarantine)
2. Implement checkout verification (check calibration before issuing tool)
3. Weekly audit of tool calibration status (prevent expired tools returning to circulation)

**Cold Weather Operations:**
Jennifer's cold weather recommendations (from Jan 18) are valuable:
- Ladder ice inspection below 0°C
- Gearbox pre-heating below 5°C nacelle temp
- Oil drain time adjustment for temperature

These should be added to procedure as seasonal guidance.

**Positive:**
- Learning from reports helped avoid multiple delays (filter housing, O-ring replacement)
- Oil change completed successfully
- Vibration baseline acceptable: 3.1 mm/s
- Filter and O-ring replaced preventively (good maintenance practice)

**Results:**
- Gearbox oil changed successfully (180 L)
- Filter replaced with new O-ring (preventive maintenance)
- Oil fill complete and circulated
- Vibration: 3.1 mm/s (acceptable baseline)
- Turbine returned to service

**Recommendations:**
1. **URGENT: Add explicit LOTO sequence to procedure (safety-critical)**
2. **URGENT: Escalate tool calibration issue to operations manager (systemic failure)**
3. Add cold weather precautions (ladder ice check, gearbox pre-heating)
4. Add filter housing O-ring replacement schedule (12 months maximum)
5. Implement tool room checkout verification process (calibration check before issue)
6. Consider pre-job briefing system (review similar recent reports before work)

## Photos

![Ladder ice buildup on nacelle access (safety hazard)](../photos/2026/03/03/report-wind-gb-003-photo1.png)

![Slow oil drain due to cold viscosity (4 L/min vs. 8 L/min normal)](../photos/2026/03/03/report-wind-gb-003-photo2.png)

![Filter housing O-ring showing early hardening (18 months old)](../photos/2026/03/03/report-wind-gb-003-photo3.png)

![Expired torque wrench calibration - seventh site-wide incident](../photos/2026/03/03/report-wind-gb-003-photo4.png)
