# RB-VLV-003: Isolation Valve Replacement DN150 PN16

**Procedure Code:** PROC-VLV-2024-003  
**Runbook ID:** RB-VLV-003  
**Version:** 3.2  
**Date:** 2026-01-20  
**Classification:** Corrective Maintenance - Safety Class 2

## 1. Objective
Replace isolation valve DN150 PN16 on primary cooling circuit following leak detection or scheduled replacement.

## 2. Prerequisites
- Shift Supervisor authorization (Form SSA-001)
- Full PPE (anti-contamination suit, double gloves, dosimeter, safety glasses)
- Unit in cold shutdown (>72 hours)
- Circuit isolated and drained
- LOTO procedure completed (Form LOTO-CC-001)

## 3. Required Tools
- Torque wrench 50-300 Nm (Ref: DYN-300) - **Verify calibration <12 months**
- Flange spreader hydraulic (Ref: FS-HYD-150)
- Gasket cutter tool (Ref: GC-001)
- Digital pressure gauge 0-10 bar (Ref: DPG-100) - **Verify calibration <6 months**
- Valve alignment jig (Ref: VAJ-DN150)
- Replacement valve DN150 PN16 (Ref: VLV-ISO-DN150-PN16)
- Gasket kit spiral wound (Ref: GSK-DN150-SW)

## 4. Estimated Duration
**4 hours** (excluding circuit drain time)

## 5. Safety Notes
⚠️ **CRITICAL SAFETY WARNINGS:**
- Verify zero pressure before loosening bolts (residual pressure risk)
- Use secondary pressure indicator for verification
- Wear face shield during bolt removal (fluid spray risk)
- Check for radioactive contamination before handling old valve

---

## STEP-BY-STEP PROCEDURE

### Step 1: Pre-Work Verification (15 min)

**Actions:**
1. Verify LOTO tags in place on valves V-302-UP and V-302-DN
2. Check dosimeter reading (should be <0.5 mSv/h)
3. Verify all required tools present and calibrated
4. Review emergency procedures with team

**Tools:** Dosimeter, Tool checklist

**Safety:** Verify LOTO before proceeding

**Expected Result:** All prerequisites confirmed, team briefed

---

### Step 2: Depressurization Verification (20 min)

**Actions:**
1. Open drain valve V-302-DR slowly
2. Monitor primary pressure gauge PG-302 until 0 bar
3. **NEW:** Hold at 0 bar for 5 minutes minimum
4. **NEW:** Verify with secondary pressure indicator PI-302 that pressure remains at 0 bar
5. Document readings on form PVF-001

**Tools:** 
- Primary pressure gauge PG-302
- Secondary pressure indicator PI-302 (Tool Crib TC-3, Shelf B-12)

**Safety:** 
⚠️ **CRITICAL:** Do NOT proceed if pressure >0.1 bar on either gauge
⚠️ Residual pressure can cause fluid spray and injury

**Expected Result:** 
- Both gauges read 0 bar for 5 consecutive minutes
- Form PVF-001 completed with both readings

**Common Issues:**
- Gauge PG-302 may read 0 bar but residual pressure remains
- Always use secondary verification

---

### Step 3: Flange Bolt Removal (30 min)

**Actions:**
1. Position drip tray under valve flange
2. Loosen bolts in cross pattern (see diagram below)
3. Remove bolts completely and store in parts tray
4. Use flange spreader to separate flanges (max 5mm gap)

**Bolt Removal Sequence (Cross Pattern):**
```
        12
    11      1
  10          2
9               3
  8           4
    7       5
        6

Start at 12 o'clock, proceed: 12→6→3→9→1→7→4→10→2→8→5→11
```

**Tools:** 
- Socket wrench 24mm
- Flange spreader FS-HYD-150
- Drip tray

**Safety:** 
- Wear face shield
- Stand to side when loosening first bolt
- Expect small fluid release

**Expected Result:** 
- All 12 bolts removed
- Flanges separated 5mm
- Minimal fluid release (<100ml)

---

### Step 4: Old Valve Removal (25 min)

**Actions:**
1. Check for radioactive contamination with survey meter
2. If contamination >background, notify RP technician
3. Use hoist to support valve weight (45 kg)
4. Remove old valve carefully
5. Place in designated waste container WC-RAD-001

**Tools:** 
- Survey meter (RP-SM-001)
- Chain hoist 500kg capacity
- Waste container WC-RAD-001

**Safety:** 
⚠️ Valve may be contaminated - handle with care
⚠️ Use proper lifting technique - 45kg load

**Expected Result:** 
- Old valve removed safely
- Contamination levels documented
- Valve in waste container

---

### Step 5: Flange Surface Preparation (20 min)

**Actions:**
1. Remove old gasket with gasket cutter tool
2. Clean flange surfaces with wire brush
3. Inspect for damage, pitting, or corrosion
4. Wipe surfaces with clean lint-free cloth
5. Apply thin layer of anti-seize compound

**Tools:** 
- Gasket cutter GC-001
- Wire brush
- Lint-free cloths
- Anti-seize compound AS-HT-001

**Safety:** 
- Wear cut-resistant gloves
- Avoid breathing gasket dust

**Expected Result:** 
- Flange surfaces clean and smooth
- No visible damage or corrosion
- Ready for new gasket installation

**Acceptance Criteria:**
- Surface roughness <6.3 μm Ra
- No scratches >0.5mm deep
- No corrosion pits

---

### Step 6: New Valve Installation (30 min)

**Actions:**
1. Verify new valve serial number matches work order
2. Install new spiral wound gasket on upstream flange
3. Use alignment jig VAJ-DN150 to position valve
4. Verify valve orientation (flow arrow matches circuit direction)
5. Support valve with hoist while aligning bolt holes
6. Insert all 12 bolts finger-tight

**Tools:** 
- Alignment jig VAJ-DN150
- Chain hoist
- New valve (verify serial number)
- New gasket GSK-DN150-SW

**Safety:** 
- Verify flow direction before final positioning
- Keep hands clear of pinch points

**Expected Result:** 
- Valve properly aligned
- Flow direction correct
- All bolts inserted finger-tight

**Critical Check:**
✓ Flow arrow on valve body points toward downstream

---

### Step 7: Bolt Torquing (45 min)

**Actions:**
1. Verify torque wrench calibration valid (<12 months)
2. Set torque wrench to 180 Nm
3. Torque bolts in star pattern (3 passes)
   - Pass 1: 60 Nm (33%)
   - Pass 2: 120 Nm (67%)
   - Pass 3: 180 Nm (100%)
4. Mark each bolt with torque paint after final pass
5. Record torque values on form BTF-001

**Torque Sequence (Star Pattern):**
```
        12
    11      1
  10          2
9               3
  8           4
    7       5
        6

Pass 1 (60 Nm):  1→7→4→10→2→8→5→11→3→9→6→12
Pass 2 (120 Nm): 1→7→4→10→2→8→5→11→3→9→6→12
Pass 3 (180 Nm): 1→7→4→10→2→8→5→11→3→9→6→12
```

**Tools:** 
- Torque wrench DYN-300 (calibrated)
- Torque paint marker
- Form BTF-001

**Safety:** 
⚠️ **CRITICAL:** Use calibrated torque wrench only
⚠️ Incorrect torque = leak risk or flange damage

**Expected Result:** 
- All bolts torqued to 180 Nm ±5 Nm
- Torque paint marks visible
- Form BTF-001 completed

**Common Issues:**
- Torque wrench calibration expired - check BEFORE starting
- Uneven torque causes leaks - follow star pattern exactly

---

### Step 8: Pressure Test (30 min)

**Actions:**
1. Close drain valve V-302-DR
2. Slowly open upstream isolation valve V-302-UP (25% increments)
3. Pressurize to 1.5 bar (test pressure)
4. Hold for 15 minutes
5. Inspect flange for leaks (visual + leak detection spray)
6. If no leaks, pressurize to 3.0 bar (operating pressure)
7. Hold for 15 minutes
8. Final leak inspection

**Tools:** 
- Pressure gauge DPG-100
- Leak detection spray LDS-001
- Flashlight

**Safety:** 
- Stand clear during initial pressurization
- Use leak spray, not hands, to detect leaks

**Expected Result:** 
- No leaks at 1.5 bar (15 min hold)
- No leaks at 3.0 bar (15 min hold)
- Pressure stable

**Acceptance Criteria:**
- Zero visible leaks
- Pressure drop <0.1 bar over 15 minutes
- No audible hissing

**If Leaks Detected:**
1. Depressurize immediately
2. Check bolt torque values
3. Re-torque if needed
4. Repeat pressure test

---

### Step 9: Return to Service (15 min)

**Actions:**
1. Fully open upstream valve V-302-UP
2. Fully open downstream valve V-302-DN
3. Remove LOTO tags (document on form LOTO-CC-001)
4. Verify normal flow rate (350 m³/h ±5%)
5. Monitor for 10 minutes
6. Final leak inspection
7. Clean work area
8. Return tools to tool crib

**Tools:** 
- Flow meter FM-302
- Cleaning supplies

**Safety:** 
- Verify system stable before leaving area

**Expected Result:** 
- Valve fully operational
- Flow rate nominal (350 m³/h)
- No leaks detected
- Work area clean
- LOTO removed and documented

---

## 6. Final Checkpoints

- [ ] Valve serial number documented
- [ ] All bolts torqued to 180 Nm
- [ ] Pressure test passed (1.5 bar + 3.0 bar)
- [ ] No leaks detected
- [ ] Flow rate nominal (350 m³/h ±5%)
- [ ] LOTO removed
- [ ] Forms completed (PVF-001, BTF-001, LOTO-CC-001)
- [ ] Tools returned to crib
- [ ] Work area clean

## 7. References
- ASME B31.1 Section 137.4.3 (Pressure Testing)
- NRC Regulatory Guide 1.33 (Quality Assurance)
- ASN Guide 0.5 (Maintenance of Pressure Equipment)
- Plant Procedure PP-MECH-001 (Valve Replacement)

## 8. Revision History
- v3.2 (2026-01-20): Added secondary pressure verification (Step 2), bolt torque diagram (Step 7)
- v3.1 (2025-12-01): Updated torque values from 150 Nm to 180 Nm per engineering change EC-2025-089
- v3.0 (2025-10-15): Complete rewrite following incident INV-2025-034
