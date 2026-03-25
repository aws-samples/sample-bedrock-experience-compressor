# RB-002: Steam Generator Tube Inspection

**Procedure Code:** PROC-SG-2024-002
**Runbook ID:** RB-002
**Version:** 2.1
**Date:** 2024-08-20
**Classification:** In-Service Inspection - Safety Class 1

## 1. Objective
Eddy current inspection of steam generator tubes to detect wall thinning, cracks, and corrosion.

## 2. Prerequisites
- Reactor in cold shutdown (minimum 48 hours)
- Radiation Protection Officer (RPO) authorization
- Full PPE (anti-contamination suit, respirator, double gloves, dosimeter)
- Steam generator isolated and depressurized
- Manway access clearance obtained
- Scaffold installation completed

## 3. Required Tools
- Eddy current tester (Ref: ECT-2000 or equivalent)
- Calibration standard tubes (Ref: CAL-SG-STD-001)
- Borescope with articulated head
- Radiation monitor (portable)
- Tube sheet mapping template
- Data acquisition laptop
- Probe guide rods (various lengths)

## 4. Estimated Duration
**8 hours** (single steam generator, full tube bundle inspection)

## 5. Safety Notes
⚠️ **CRITICAL SAFETY WARNINGS:**
- Confined space entry - verify atmosphere <19.5% O2, <0.5% CO
- Radiation levels may exceed 5 mSv/h near tube sheet
- Maintain continuous communication with outside personnel
- Emergency evacuation route must remain clear
- Do not exceed 30-minute periods inside manway

---

## STEP-BY-STEP PROCEDURE

### Step 1: Pre-Work Authorization (30 min)

**Actions:**
1. Obtain work permit from Shift Supervisor
2. Review radiation survey report (latest <24 hours)
3. Attend pre-job briefing with RPO and safety officer
4. Verify emergency rescue equipment positioned outside manway
5. Test communication equipment (radio or phone)
6. Review tube plugging history (tubes already removed from service)

**Tools:**
- Work permit form WP-SG-001
- Radiation survey report
- Communication equipment

**Safety:**
⚠️ Verify rescue equipment functional before entry

**Expected Result:**
- All authorizations obtained
- Team briefed on hazards and emergency procedures
- Communication verified

---

### Step 2: Scaffold Installation (60 min)

**Actions:**
1. Verify scaffold components present (per checklist SC-SG-001)
2. Install scaffold platform at manway elevation
3. Install ladder access to platform
4. Install handrails and fall protection
5. Load limit test (static load 500 kg for 5 minutes)
6. Inspector signs off on scaffold integrity

**Tools:**
- Scaffold components (certified)
- Fall protection harness
- Load test weights

**Safety:**
⚠️ Do not use scaffold until load test passed and signed off

**Expected Result:**
- Scaffold installed per standard
- Load test passed
- Safe access to manway established

---

### Step 3: Manway Access (45 min)

**Actions:**
1. Remove manway insulation (may contain asbestos - verify material first)
2. Remove 24 M20 manway bolts in cross pattern
3. Store bolts in numbered tray (for reinstallation tracking)
4. Carefully remove manway cover (250 kg - use hoist)
5. Store gasket (inspect condition, replace if compressed >30%)
6. Perform atmosphere test (O2, CO, radiation level)
7. Install ventilation fan (minimum 4 air changes per hour)

**Tools:**
- Socket wrench 30mm
- Chain hoist 500kg capacity
- Atmosphere monitor (O2/CO)
- Radiation survey meter
- Ventilation fan (portable)

**Safety:**
⚠️ **CRITICAL:** Do not enter until atmosphere verified safe
⚠️ Manway cover is heavy - use hoist, do not attempt manual lift

**Expected Result:**
- Manway open
- Atmosphere safe for entry (O2 19.5-23.5%, CO <0.5%, radiation <5 mSv/h)
- Ventilation operating

---

### Step 4: Eddy Current Probe Setup (30 min)

**Actions:**
1. Connect ECT-2000 tester to laptop
2. Load tube bundle configuration file (SG-A or SG-B specific)
3. Perform probe calibration using standard tubes:
   - Zero defect standard (baseline)
   - 20% wall thinning standard
   - 40% wall thinning standard
   - Crack reference standard
4. Verify calibration repeatability (3 measurements <5% variance)
5. Document calibration results on form ECT-CAL-001
6. Select appropriate probe (0.75" bobbin probe for standard tubes)

**Tools:**
- ECT-2000 eddy current tester
- Calibration standards CAL-SG-STD-001
- Data acquisition laptop
- Bobbin probe 0.75" diameter

**Safety:**
- Verify electrical isolation before connecting equipment

**Expected Result:**
- ECT system calibrated and verified
- Baseline readings documented
- System ready for inspection

**Common Issues:**
- Probe calibration may drift in high humidity environment
- Verify calibration every 2 hours during inspection

---

### Step 5: Tube Sheet Mapping (90 min)

**Actions:**
1. Enter confined space (2-person team: operator + safety watch)
2. Position at tube sheet level
3. Document tube sheet condition (general corrosion, deposits, leaks)
4. Map tube locations using grid template (rows 1-120, columns A-P)
5. Identify tubes previously plugged (verify against records)
6. Mark suspect tubes for priority inspection:
   - Tubes with visible corrosion
   - Tubes with boric acid deposits
   - Tubes in high stress zones (U-bend region)
7. Photograph tube sheet for records

**Tools:**
- Tube sheet mapping template
- Marker pen (permanent)
- Digital camera
- Flashlight (LED, explosion-proof)

**Safety:**
⚠️ Safety watch remains outside manway
⚠️ Maximum 30 minutes inside - rotate personnel
⚠️ Monitor dosimeter readings continuously

**Expected Result:**
- Tube sheet mapped
- Priority inspection list identified
- Photographs documented

---

### Step 6: Eddy Current Inspection (180 min)

**Actions:**
1. Begin inspection with priority tubes (identified in Step 5)
2. Insert probe guide rod to full tube length
3. Advance ECT probe through tube at constant speed (15 cm/sec)
4. Monitor waveform on laptop screen for anomalies:
   - Wall thinning (amplitude reduction)
   - Cracks (phase angle shift)
   - Denting (geometric distortion)
5. Mark any indications >20% wall loss for engineering review
6. Document findings in real-time on data acquisition system
7. Inspect minimum 30% of tube bundle (statistical sample)
8. For tubes with indications >40%, perform second pass for verification

**Inspection Priority:**
- Hot leg tubes (highest temperature stress)
- U-bend region (highest mechanical stress)
- Tubes with historical defects
- Random statistical sample (30% of remaining tubes)

**Tools:**
- ECT-2000 with bobbin probe
- Probe guide rods (various lengths)
- Data acquisition laptop
- Tube defect recording form

**Safety:**
- Rotate personnel every 30 minutes inside manway
- Monitor radiation exposure continuously

**Expected Result:**
- Minimum 30% of tubes inspected
- All indications >20% documented
- Data saved to acquisition system

**Acceptance Criteria:**
- <5% of tubes with indications >20% wall loss
- Zero tubes with indications >70% wall loss
- Any cracks require immediate engineering review

---

### Step 7: Data Analysis (60 min)

**Actions:**
1. Exit confined space
2. Review ECT data with engineering team
3. Classify defects by severity:
   - Category 1: <20% wall loss (acceptable)
   - Category 2: 20-40% wall loss (monitor next inspection)
   - Category 3: 40-70% wall loss (plug tube this outage)
   - Category 4: >70% wall loss (plug immediately)
4. Generate tube plugging list if required
5. Document findings on inspection report form ISI-SG-001
6. Obtain engineer approval for tube plugging plan

**Tools:**
- Data acquisition laptop
- Inspection report form ISI-SG-001
- Defect classification guide

**Safety:**
- Review radiation exposure totals for team

**Expected Result:**
- All defects classified
- Tube plugging plan approved (if required)
- Inspection report completed

---

### Step 8: Manway Closure (45 min)

**Actions:**
1. Remove all tools and equipment from steam generator
2. Perform final inspection inside manway (no foreign material left behind)
3. Install new manway gasket (replace old gasket even if acceptable)
4. Position manway cover using hoist
5. Install 24 M20 bolts finger-tight in cross pattern
6. Torque bolts to 400 Nm in 3 passes (cross pattern):
   - Pass 1: 150 Nm
   - Pass 2: 275 Nm
   - Pass 3: 400 Nm
7. Mark bolts with torque paint
8. Reinstall insulation

**Torque Sequence (Cross Pattern):**
```
Start at 12 o'clock position, alternate across diameter:
1→13→7→19→4→16→10→22→2→14→8→20→5→17→11→23→3→15→9→21→6→18→12→24
```

**Tools:**
- Torque wrench 200-500 Nm (calibrated)
- New gasket (from kit GSKT-SG-001)
- Torque paint marker
- Chain hoist

**Safety:**
⚠️ Use calibrated torque wrench only
⚠️ Verify no tools or materials left inside steam generator

**Expected Result:**
- Manway closed and torqued per specification
- No foreign material left inside
- Insulation reinstalled

---

### Step 9: Documentation (30 min)

**Actions:**
1. Complete inspection report form ISI-SG-001
2. Upload ECT data to engineering database
3. Update tube bundle records (plugged tubes, degradation trends)
4. Obtain final sign-off from RPO (radiation exposure summary)
5. Return tools to calibration lab (ECT equipment requires post-use calibration check)
6. Decontaminate personnel and equipment
7. Archive inspection records per QA requirements

**Tools:**
- Inspection report forms
- Database access
- Contamination monitor

**Safety:**
- Verify personnel contamination levels before leaving controlled area

**Expected Result:**
- All documentation completed
- Data archived
- Equipment returned and decontaminated

---

## 6. Final Checkpoints

- [ ] Minimum 30% of tube bundle inspected
- [ ] All defects >20% documented and classified
- [ ] Tube plugging plan approved (if required)
- [ ] Manway bolts torqued to 400 Nm
- [ ] No foreign material left inside steam generator
- [ ] Inspection data uploaded to database
- [ ] Personnel radiation exposure within limits (<2 mSv per person)
- [ ] All tools returned to crib
- [ ] ISI-SG-001 report completed and signed

## 7. References
- ASME Boiler & Pressure Vessel Code Section XI
- EPRI Steam Generator Management Program (TR-107569)
- ASN Guide 6.8 (Steam Generator Inspection)
- NRC Regulatory Guide 1.83

## 8. Revision History
- v2.1 (2024-08-20): Updated probe calibration frequency requirements
- v2.0 (2024-03-15): Added tube sheet mapping step
- v1.5 (2023-11-01): Revised torque sequence for manway closure
