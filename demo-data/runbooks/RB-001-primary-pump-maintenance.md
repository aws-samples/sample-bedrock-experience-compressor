# RB-001: Primary Coolant Pump Maintenance

**Procedure Code:** PROC-RCP-2024-001  
**Runbook ID:** RB-001  
**Version:** 3.2  
**Date:** 2025-11-15  
**Classification:** Preventive Maintenance - Safety Class 2

## 1. Objective
Quarterly preventive maintenance of primary circuit coolant pumps (RCP).

## 2. Prerequisites
- Shift Supervisor authorization (Form SSA-001)
- Full PPE (anti-contamination suit, double gloves, dosimeter, safety glasses)
- Unit in planned outage or reduced power < 30%
- LOTO procedure completed (Form LOTO-RCP-001)

## 3. Required Tools
- Torque wrench 50-250 Nm (Ref: DYN-250) - **Verify calibration <12 months**
- Fluke 87V multimeter - **Verify calibration <6 months**
- FLIR E8 thermal camera - **Verify battery >50%**
- O-ring seal kit (Ref: KIT-RCP-001)
- Hoist 500kg capacity
- Socket wrench set

## 4. Estimated Duration
**4 hours** (excluding cooldown)

## 5. Safety Notes
⚠️ **CRITICAL SAFETY WARNINGS:**
- Verify zero voltage before touching electrical components
- Wait minimum 2 hours for cooldown before disassembly
- Impeller may seize on shaft - do not force extraction
- Check for radioactive contamination before handling components

---

## STEP-BY-STEP PROCEDURE

### Step 1: Pre-Work Verification (10 min)

**Actions:**
1. Verify LOTO tags in place
2. Check dosimeter reading (should be <0.5 mSv/h)
3. Verify all required tools present and calibrated
4. Verify thermal camera battery charged (>50%)
5. Review emergency procedures with team

**Tools:** Dosimeter, Tool checklist

**Safety:** Verify LOTO before proceeding

**Expected Result:** All prerequisites confirmed, team briefed

---

### Step 2: Electrical Isolation (15 min)

**Actions:**
1. Electrically isolate pump (Breaker DJ-RCP-01)
2. Verify zero voltage with VAT (multimeter)
3. Apply lockout/tagout per Form LOTO-RCP-001
4. Wait for pump cooldown < 40°C (minimum 2 hours)
5. Verify temperature with thermal camera

**Tools:** 
- Fluke 87V multimeter (calibrated)
- FLIR E8 thermal camera
- LOTO tags

**Safety:** 
⚠️ **CRITICAL:** Verify zero voltage before proceeding
⚠️ Do not proceed if temperature >40°C

**Expected Result:** 
- Zero voltage confirmed
- Temperature <40°C
- LOTO applied and documented

---

### Step 3: Circuit Isolation (20 min)

**Actions:**
1. Close upstream isolation valve V-RCP-UP
2. Close downstream isolation valve V-RCP-DN
3. Open drain valve VP-RCP-01 slowly
4. Drain circuit completely (expect ~50 liters)
5. Verify zero pressure with pressure gauge

**Tools:** 
- Drain container (50L capacity)
- Pressure gauge

**Safety:** 
- Wear face shield during drain operation
- Fluid may be contaminated

**Expected Result:** 
- Circuit fully drained
- Zero pressure confirmed
- Fluid collected in container

---

### Step 4: Flange Disassembly (30 min)

**Actions:**
1. Position drip tray under flange
2. Remove 12 M16 bolts in cross pattern
3. Store bolts in parts tray
4. Carefully separate flange halves

**Bolt Removal Sequence (Cross Pattern):**
```
        12
    11      1
  10          2
9               3
  8           4
    7       5
        6

Remove: 1→7→4→10→2→8→5→11→3→9→6→12
```

**Tools:** 
- Socket wrench 24mm
- Drip tray
- Parts tray

**Safety:** 
- Expect residual fluid release
- Wear gloves

**Expected Result:** 
- All 12 bolts removed
- Flange separated
- Minimal fluid release

---

### Step 5: Impeller Extraction (45 min)

**Actions:**
1. Connect hoist to impeller lifting points
2. Apply gentle upward tension
3. **If impeller resists (common issue):**
   - Apply penetrating oil around shaft
   - Wait 10 minutes for penetration
   - Use soft mallet to tap gently while pulling
   - DO NOT apply excessive force
4. Extract impeller carefully (45 kg)
5. Place on clean work surface

**Tools:** 
- Chain hoist 500kg capacity
- Penetrating oil
- Soft mallet
- Clean work surface

**Safety:** 
⚠️ **CRITICAL:** Impeller typically seizes on shaft due to thermal expansion
⚠️ Do not force - risk of impeller damage

**Expected Result:** 
- Impeller extracted without damage
- Shaft visible for inspection

**Common Issues:**
- Impeller seizure is normal - use penetrating oil technique

---

### Step 6: Inspection (30 min)

**Actions:**
1. Visual inspection of impeller (wear, cavitation, cracks)
2. Measure axial clearance with feeler gauge (tolerance: 0.2-0.5 mm)
3. Check O-ring seal condition (replace if worn)
4. Thermographic inspection of bearings with FLIR camera
5. Document findings on Form RCP-INSP-001

**Tools:** 
- Feeler gauge set
- FLIR E8 thermal camera
- Inspection form RCP-INSP-001

**Safety:** 
- Check for contamination before handling

**Expected Result:** 
- Impeller condition documented
- Clearance within tolerance
- Bearing temperature <65°C
- O-ring condition assessed

**Acceptance Criteria:**
- No cracks or cavitation damage
- Clearance 0.2-0.5 mm
- Bearing temperature <65°C

---

### Step 7: Reassembly (40 min)

**Actions:**
1. Replace O-ring seals (use new seals from kit)
2. Apply light lubricant to O-rings
3. Reinstall impeller (align reference marks)
4. Install flange bolts finger-tight
5. Torque bolts to 180 Nm in cross pattern (3 passes)
   - Pass 1: 60 Nm
   - Pass 2: 120 Nm
   - Pass 3: 180 Nm
6. Mark bolts with torque paint

**Torque Sequence (Cross Pattern):**
```
Pass 1 (60 Nm):  1→7→4→10→2→8→5→11→3→9→6→12
Pass 2 (120 Nm): 1→7→4→10→2→8→5→11→3→9→6→12
Pass 3 (180 Nm): 1→7→4→10→2→8→5→11→3→9→6→12
```

**Tools:** 
- Torque wrench DYN-250 (calibrated)
- O-ring seal kit KIT-RCP-001
- Torque paint marker

**Safety:** 
⚠️ Use calibrated torque wrench only

**Expected Result:** 
- All bolts torqued to 180 Nm ±5 Nm
- Torque paint marks visible
- Impeller properly aligned

---

### Step 8: Leak Test (30 min)

**Actions:**
1. Close drain valve VP-RCP-01
2. Slowly open isolation valves
3. Fill circuit and bleed air
4. Pressurize to 1.5 bar (test pressure)
5. Hold for 15 minutes
6. Inspect for leaks
7. If no leaks, proceed to operational test

**Tools:** 
- Pressure gauge
- Leak detection spray

**Safety:** 
- Stand clear during pressurization

**Expected Result:** 
- No leaks at 1.5 bar
- Pressure stable for 15 minutes

**Acceptance Criteria:**
- Zero visible leaks
- Pressure drop <0.1 bar over 15 minutes

---

### Step 9: Return to Service (20 min)

**Actions:**
1. Remove electrical lockout per Form LOTO-RCP-001
2. Progressive startup (30 second ramp)
3. Monitor vibrations (should be <4.5 mm/s RMS)
4. Check flow rate (350 m³/h ±5%)
5. Monitor bearing temperature (<65°C)
6. Run for 10 minutes, verify stable operation
7. Clean work area
8. Return tools to tool crib

**Tools:** 
- Vibration meter
- Flow meter
- Thermal camera

**Safety:** 
- Monitor for abnormal vibrations or noise

**Expected Result:** 
- Pump running smoothly
- Vibrations <4.5 mm/s RMS
- Flow rate 350 m³/h ±5%
- Bearing temperature <65°C
- No leaks

---

## 6. Final Checkpoints

- [ ] Bearing temperature < 65°C
- [ ] Vibrations < 4.5 mm/s RMS
- [ ] Flow rate 350 m³/h ±5%
- [ ] No leaks detected
- [ ] All bolts torqued to 180 Nm
- [ ] LOTO removed and documented
- [ ] Forms completed (LOTO-RCP-001, RCP-INSP-001)
- [ ] Tools returned to crib
- [ ] Work area clean

## 7. References
- NF EN 13480 (Metallic piping)
- ASN Guide 2.14 (Equipment maintenance)
- ASME Section XI (In-Service Inspection)

## 8. Revision History
- v3.2 (2025-11-15): Added impeller extraction technique (Step 5)
- v3.1 (2025-09-01): Updated torque values
- v3.0 (2025-06-15): Complete rewrite following incident
