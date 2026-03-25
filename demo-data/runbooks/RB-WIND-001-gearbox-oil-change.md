# RB-WIND-001: Wind Turbine Gearbox Oil Change

**Procedure Code:** PROC-WIND-GB-2024-001
**Runbook ID:** RB-WIND-001
**Version:** 3.0
**Date:** 2024-07-15
**Classification:** Preventive Maintenance - Medium Voltage Work

## 1. Objective
Scheduled oil change and filter replacement for wind turbine gearbox to maintain lubrication system integrity.

## 2. Prerequisites
- Turbine stopped and locked out
- Weather conditions acceptable (wind speed <15 m/s, no ice on ladder)
- Fall protection equipment certified (<6 months)
- Oil disposal contractor confirmed available
- Replacement oil delivered to site (verify viscosity grade matches: ISO VG 320)
- Nacelle access authorization obtained

## 3. Required Tools
- Oil transfer pump (electric or pneumatic)
- Oil drain containers (200L capacity minimum)
- Filter wrench (heavy-duty)
- Torque wrench 50-200 Nm (calibrated)
- Vibration analyzer (for baseline measurement)
- Oil sampling kit
- PPE for height work (harness, helmet, safety glasses)
- Spill containment kit

## 4. Estimated Duration
**5 hours** (per turbine, typical 2.5 MW gearbox)

## 5. Safety Notes
⚠️ **CRITICAL SAFETY WARNINGS:**
- Work at height - verify fall protection before climbing
- Ladder may be icy in cold weather - inspect before use
- Oil temperature may exceed 60°C - allow cooldown before draining
- Confined space in nacelle - ensure ventilation adequate
- Manual handling hazard - oil drums weigh 180 kg when full

---

## STEP-BY-STEP PROCEDURE

### Step 1: Turbine Shutdown and LOTO (30 min)

**Actions:**
1. Access SCADA system and initiate controlled turbine stop
2. Verify turbine blades pitched to feather position (90°)
3. Verify rotor stopped (zero RPM for minimum 10 minutes)
4. Apply electrical lockout at base of tower (main breaker)
5. Apply mechanical lockout on yaw brake system
6. Tag turbine controls with LOTO tags (Form LOTO-WIND-001)
7. Verify gearbox oil temperature <40°C before climbing tower
8. Post warning signs at tower base

**Tools:**
- SCADA access terminal
- LOTO locks and tags
- Thermal camera (or oil temperature indicator)
- Warning signs

**Safety:**
⚠️ **CRITICAL:** Do not climb tower until electrical LOTO verified
⚠️ Verify rotor stopped and blades feathered
⚠️ Check oil temperature <40°C (risk of burns during drain)

**Expected Result:**
- Turbine fully stopped and locked out
- LOTO documentation completed
- Safe to access nacelle

---

### Step 2: Nacelle Access (20 min)

**Actions:**
1. Inspect tower ladder for ice, damage, or loose rungs
2. Don fall protection harness and verify anchor points
3. Carry tools in backpack or hoist separately (do not carry in hands during climb)
4. Climb tower ladder (typical height 80-100 meters)
5. Enter nacelle through access hatch
6. Verify ventilation adequate (no oil vapor accumulation)
7. Set up work area lighting (LED portable lights)
8. Hoist oil transfer equipment using winch

**Tools:**
- Fall protection harness (certified)
- Climbing safety line
- LED work lights
- Tool backpack or hoist rope

**Safety:**
⚠️ **CRITICAL:** Do not climb in adverse weather (wind >15 m/s, ice present)
⚠️ Maintain three points of contact during climb
⚠️ Use safety line at all times above 2 meters

**Expected Result:**
- Safe access to nacelle achieved
- Work area set up with lighting
- Equipment hoisted to nacelle level

**Common Issues:**
- Ladder icing in winter conditions - use ice cleats or delay work
- High winds make climb dangerous - monitor weather forecast

---

### Step 3: Oil Drain (90 min)

**Actions:**
1. Position drain container (200L capacity) under gearbox drain valve
2. Place absorbent mats around drain area (spill containment)
3. Open gearbox inspection cover (4 M10 bolts) to vent system
4. Slowly open drain valve (typically 2" ball valve)
5. Allow oil to drain by gravity (expect 150-180 liters)
6. Monitor drain flow - may slow due to high viscosity in cold weather
7. When flow stops, close drain valve
8. Take used oil sample for laboratory analysis (contamination, wear metals)
9. Seal drain containers and label for disposal

**Oil Drain Time Estimates:**
- Summer (oil temp 25-35°C): 60 minutes
- Winter (oil temp 5-15°C): 90+ minutes (viscosity increases significantly)

**Tools:**
- Oil drain container (200L capacity)
- Absorbent mats and spill kit
- Oil sampling bottles (clean, labeled)
- Drain valve wrench

**Safety:**
⚠️ Oil may be hot (up to 60°C) - wear heat-resistant gloves
⚠️ Spills create slip hazard - contain immediately

**Expected Result:**
- Gearbox oil fully drained (150-180 liters typical)
- Used oil sample collected for analysis
- No spills outside containment area

**Common Issues:**
- Cold weather slows drain significantly - plan extra time in winter
- Viscosity increases below 10°C - may require heating or extended drain time

---

### Step 4: Filter Replacement (45 min)

**Actions:**
1. Locate oil filter housing (typically on gearbox side panel)
2. Place drain pan under filter housing
3. Use filter wrench to loosen filter housing cap (large diameter, may require significant force)
4. Remove old filter element and inspect for debris or metal particles
5. Clean filter housing interior with lint-free cloth
6. Inspect housing O-ring seal (replace if damaged or compressed >20%)
7. Install new filter element (verify part number matches OEM specification)
8. Lubricate O-ring with clean oil
9. Install filter housing cap and torque to specification (120 Nm)
10. Dispose of used filter per environmental regulations

**Filter Housing Torque:**
- Specification: 120 Nm ±10 Nm
- Use calibrated torque wrench - do not overtighten (risk of housing crack)

**Tools:**
- Heavy-duty filter wrench (may require 18-24" diameter)
- Torque wrench 50-200 Nm (calibrated)
- Drain pan
- Lint-free cleaning cloths
- Replacement filter element (OEM part number)
- Replacement O-ring seals

**Safety:**
- Filter housing may be stuck due to thermal cycling - do not use excessive force
- Apply penetrating oil if housing seized

**Expected Result:**
- Old filter removed and inspected
- New filter installed and torqued to specification
- No leaks at filter housing

**Common Issues:**
- Filter housing frequently seized - penetrating oil and patience required
- O-ring seals deteriorate quickly in high-temperature service

---

### Step 5: Oil Fill and Circulation (60 min)

**Actions:**
1. Connect oil transfer pump to new oil drums (verify ISO VG 320 grade)
2. Connect transfer hose to gearbox fill port
3. Begin pumping oil into gearbox
4. Fill to sight glass level (typically 160-180 liters total capacity)
5. Close fill port
6. Manually rotate input shaft 3-4 revolutions (distribute oil, prime pump)
7. Check sight glass level again (may drop as oil fills internal passages)
8. Top up to correct level if needed
9. Close inspection cover (torque 4 M10 bolts to 25 Nm)
10. Verify no leaks at drain valve, filter housing, or fill port

**Oil Fill Specifications:**
- Oil grade: ISO VG 320 (verify matches OEM specification)
- Capacity: 160-180 liters (check turbine model specification)
- Fill level: middle of sight glass window

**Tools:**
- Electric or pneumatic oil transfer pump
- Transfer hoses (clean, compatible with oil)
- Funnel (if manual fill required)
- Torque wrench for inspection cover bolts

**Safety:**
- Do not overfill - causes foaming and overheating
- Verify hoses secure before starting pump

**Expected Result:**
- Gearbox filled to correct level with new oil
- No leaks detected
- Ready for startup sequence

---

### Step 6: Vibration Baseline (30 min)

**Actions:**
1. Install vibration sensors at gearbox measurement points (3 locations):
   - Input bearing housing (horizontal, vertical, axial)
   - Intermediate stage bearing
   - Output bearing housing
2. Remove electrical LOTO at tower base (maintain mechanical lockout on yaw)
3. Start turbine in test mode (low power, controlled conditions)
4. Allow gearbox to run for 10 minutes (oil circulation, system warm-up)
5. Record vibration measurements at each point
6. Compare to baseline values (typically <7 mm/s RMS acceptable)
7. Record oil pressure (should stabilize at 0.5-1.0 bar within 5 minutes)
8. Stop turbine

**Vibration Acceptance Criteria:**
- Input bearing: <7 mm/s RMS
- Intermediate bearing: <7 mm/s RMS
- Output bearing: <7 mm/s RMS
- Any reading >10 mm/s requires investigation

**Tools:**
- Vibration analyzer (triaxial capability)
- Oil pressure gauge
- Baseline vibration data (from previous maintenance)

**Safety:**
- Maintain safe distance from rotating equipment during test
- Emergency stop button must be accessible

**Expected Result:**
- Vibration levels within acceptable limits
- Oil pressure normal (0.5-1.0 bar)
- No unusual noise or vibration detected

---

### Step 7: Return to Service (45 min)

**Actions:**
1. Stop turbine and reapply electrical LOTO
2. Perform final leak inspection (drain valve, filter housing, fill port, sight glass)
3. Tighten any fittings if minor seepage detected
4. Clean work area (remove tools, wipe up any oil spills)
5. Remove oil drain containers and used filter from nacelle (hoist down safely)
6. Exit nacelle and descend tower ladder
7. Remove all LOTO tags per Form LOTO-WIND-001
8. Remove warning signs
9. Return turbine to automatic operation (SCADA control)
10. Monitor turbine performance for first 24 hours (SCADA alerts for oil pressure, temperature)

**Final Checks:**
- [ ] No leaks detected at any connection
- [ ] Oil level correct (middle of sight glass)
- [ ] Vibration baseline acceptable
- [ ] All tools removed from nacelle
- [ ] LOTO removed and documented
- [ ] Turbine returned to service

**Tools:**
- Cleaning supplies (rags, absorbents)
- Hoist rope for lowering equipment

**Safety:**
⚠️ Do not leave tools or materials in nacelle (FOD risk)
⚠️ Use caution when descending ladder with backpack

**Expected Result:**
- Turbine returned to automatic operation
- No leaks or abnormal conditions
- Documentation completed
- Used oil and filters removed for disposal

---

## 6. Final Checkpoints

- [ ] Gearbox drained completely (150-180L removed)
- [ ] New filter installed and torqued to 120 Nm
- [ ] Gearbox filled with ISO VG 320 oil (160-180L)
- [ ] Oil level correct (middle of sight glass)
- [ ] No leaks at drain valve, filter housing, or fill port
- [ ] Vibration baseline acceptable (<7 mm/s RMS all points)
- [ ] Oil pressure normal (0.5-1.0 bar)
- [ ] Used oil sample sent to lab for analysis
- [ ] LOTO removed and documented
- [ ] Turbine returned to service
- [ ] Environmental compliance (used oil disposed properly)

## 7. References
- IEC 61400-1 (Wind Turbine Design Requirements)
- ISO 12925-1 (Lubricants for Wind Turbine Gearboxes)
- Manufacturer Service Manual (model-specific)
- OSHA 1926 Subpart M (Fall Protection)

## 8. Revision History
- v3.0 (2024-07-15): Added vibration baseline measurement requirement
- v2.5 (2024-03-10): Updated filter housing torque specification
- v2.0 (2023-11-20): Added cold weather oil drain time estimates
- v1.5 (2023-06-15): Revised safety requirements for tower climbing
