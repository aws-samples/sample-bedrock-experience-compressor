# Field Report: report-wind-gb-001

**Report ID:** report-wind-gb-001
**Task ID:** task-20260118-001
**Technician:** Jennifer Walsh (tech-5023)
**Runbook:** RB-WIND-001 v3.0
**Location:** Wind Farm Site 4, Turbine WT-14
**Date:** 2026-01-18

## Timing
- Started: 07:30
- Completed: 14:15
- Duration: 405 minutes (estimated: 300 minutes)

## Status
- Everything OK: No
- Had Delays: Yes
- Runbook Rating: 3/5 stars

## Step-Specific Feedback

### Step 1: Turbine Shutdown and LOTO
- Issue: LOTO sequence unclear when both electrical and mechanical energy sources present
- Suggestion: Add explicit checklist: "☐ Electrical isolation ☐ Hydraulic pressure release ☐ Mechanical brake ☐ Rotation lock"
- Time Impact: +15 minutes (had to call supervisor for clarification)
- Safety Critical: Yes

**What Happened:**
Procedure says "apply LOTO per site standard" but doesn't specify order when multiple energy sources. Electrical is obvious, but hydraulic brake system and rotation lock order was unclear. Called supervisor who confirmed: electrical first, then hydraulics, then mechanical. This should be explicit in procedure.

### Step 2: Nacelle Access
- Issue: Nacelle access ladder had ice buildup on rungs (temperature -5°C)
- Suggestion: Add weather precaution note: "Below 0°C, inspect ladder for ice before climbing"
- Time Impact: +20 minutes (had to de-ice ladder with scraper and hot air)
- Safety Critical: Yes

### Step 3: Oil Drain
- Issue: Oil viscosity extremely high in cold weather (-5°C ambient, nacelle at 2°C)
- Suggestion: Procedure assumes normal temperature. Add: "Below 5°C nacelle temp, warm gearbox with heater 30 min before drain"
- Time Impact: +60 minutes (slow drain rate, only 2 L/min instead of expected 8 L/min)
- Safety Critical: No

**What Happened:**
Started oil drain at 08:30. Oil barely flowing - thick like molasses. Drain valve fully open but only dripping. Gearbox holds 180 liters, expected 25 minutes to drain. Actually took 90 minutes. Oil was ISO VG 320 grade which gets very thick below 5°C. Should have pre-heated gearbox.

### Step 4: Filter Replacement
- Issue: Filter housing seized - couldn't remove with standard filter wrench
- Suggestion: Add note: "If filter housing resists after 50 Nm, apply penetrating oil and wait 10 minutes. Do not exceed 80 Nm torque."
- Time Impact: +25 minutes (had to apply heat gun gently to break seal)
- Safety Critical: No

## Comments

**Weather Impact:**
This job scheduled for summer maintenance but moved to January due to outage. Procedure doesn't account for cold weather operations. Everything took longer:
- Ice on ladder +20 min
- Oil viscosity +60 min
- Filter housing cold-seized +25 min
Total weather delay: ~105 minutes

**LOTO Confusion:**
Wind turbines have multiple energy sources. Procedure assumes you know the LOTO order but doesn't state it. New techs or cross-trained staff from other sectors need explicit sequence.

**Positive:**
- Vibration baseline measurement went smoothly (3.2 mm/s, within spec)
- New oil circulation and system purge worked well
- Return to service checklist comprehensive

**Results:**
- Oil changed successfully (180 L old oil removed, 185 L new ISO VG 320 filled)
- Filter replaced (old filter showed normal wear, no metal particles)
- Vibration: 3.2 mm/s (baseline established, will monitor)
- Turbine returned to service at 14:30

**Suggestion for Planning:**
Schedule gearbox oil changes for temperatures above 10°C when possible. If winter maintenance required, add +2 hours to procedure estimate for cold weather delays.

## Photos

![Ice buildup on nacelle access ladder](../photos/2026/01/18/report-wind-gb-001-photo1.png)

![Slow oil drain due to high viscosity](../photos/2026/01/18/report-wind-gb-001-photo2.png)

![Filter housing requiring heat application](../photos/2026/01/18/report-wind-gb-001-photo3.png)
