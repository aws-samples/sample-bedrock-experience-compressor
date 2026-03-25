# RB-003: Turbine Blade Inspection

**Procedure Code:** PROC-TURB-2024-003
**Runbook ID:** RB-003
**Version:** 4.0
**Date:** 2024-09-10
**Classification:** In-Service Inspection - Safety Class 2

## 1. Objective
Visual and non-destructive inspection of high-pressure turbine blades to detect cracks, erosion, and dimensional changes.

## 2. Prerequisites
- Unit in planned outage (minimum 24 hours)
- Turbine cooled to <50°C
- Generator electrically isolated and grounded
- Turning gear disengaged and locked
- Work permit authorized by Operations Manager
- Rigging plan reviewed and approved

## 3. Required Tools
- PT/MT inspection kit (penetrant testing / magnetic particle testing)
- Micrometers (0-25mm, 25-50mm, 50-75mm ranges)
- Feeler gauge set (0.05-1.0mm)
- Torque wrench 50-500 Nm (calibrated)
- Blade clearance measurement tool
- LED inspection lights (minimum 1000 lumens)
- Borescope (optional for preliminary inspection)
- Digital camera for documentation

## 4. Estimated Duration
**6 hours** (single turbine stage, typical configuration)

## 5. Safety Notes
⚠️ **CRITICAL SAFETY WARNINGS:**
- Verify turbine electrically isolated before opening casing
- Blade edges are sharp - wear cut-resistant gloves
- Casing bolts may be corroded - do not force removal
- Use proper lifting equipment for casing removal (weight >500 kg)
- Confined space hazards - verify ventilation before entry

---

## STEP-BY-STEP PROCEDURE

### Step 1: Turbine Lockout (20 min)

**Actions:**
1. Verify turbine stopped (zero rotation for minimum 2 hours)
2. Verify generator breaker open and racked out
3. Apply electrical lockout per Form LOTO-TURB-001
4. Verify turning gear disengaged and mechanically locked
5. Install barring device to prevent rotation during work
6. Post warning signs at turbine deck level
7. Verify temperature <50°C using thermal camera

**Tools:**
- LOTO tags and locks
- Thermal camera (FLIR or equivalent)
- Barring device (mechanical lock)
- Warning signs

**Safety:**
⚠️ **CRITICAL:** Do not proceed until electrical isolation verified with VAT
⚠️ Verify temperature <50°C before opening casing

**Expected Result:**
- Turbine fully isolated (electrical, mechanical, thermal)
- LOTO documentation completed
- Safe to proceed with casing opening

---

### Step 2: Casing Opening (90 min)

**Actions:**
1. Remove turbine insulation panels (store in designated area)
2. Identify casing bolts (typical configuration: 48 M24 bolts)
3. Mark bolt positions with numbered tags (for reinstallation tracking)
4. Remove bolts in spiral pattern (starting from top centerline, working outward)
5. Store bolts in numbered tray with anti-seize compound applied
6. Install lifting eyes on casing top half (4 points)
7. Connect chain hoist to overhead beam (verify capacity >2000 kg)
8. Lift casing top half slowly (5 cm increments, check for binding)
9. Store casing on padded supports (prevent damage to machined surfaces)

**Bolt Removal Sequence (Spiral Pattern):**
```
Start at top dead center (TDC), work in expanding spiral:
TDC → TDC+15° → TDC-15° → TDC+30° → TDC-30° → continue to bottom
Prevents uneven stress distribution during removal
```

**Tools:**
- Impact wrench (air or electric) with 36mm socket
- Penetrating oil (WD-40 or equivalent)
- Chain hoist 2500kg capacity
- Lifting eyes (M24 thread)
- Padded supports for casing storage
- Numbered bolt storage tray

**Safety:**
⚠️ **CRITICAL:** Bolts may be corroded and prone to breakage
⚠️ Use proper lifting technique - casing weighs approximately 800 kg
⚠️ Never work under suspended load

**Expected Result:**
- Casing top half removed and stored safely
- All bolts removed and stored with tracking
- Blade assembly fully visible for inspection

**Common Issues:**
- Casing bolts frequently corroded (especially in coastal plants)
- Penetrating oil often required - plan additional 30 minutes if corrosion present

---

### Step 3: Blade Visual Inspection (60 min)

**Actions:**
1. Install inspection lighting (LED panels, minimum 1000 lumens)
2. Perform general visual survey of all blades
3. Look for obvious damage:
   - Cracks (especially at blade root and tip)
   - Erosion (leading edge wear from particle impact)
   - Corrosion (pitting, oxidation)
   - Foreign object damage (dents, deformation)
   - Missing or damaged locking wires
4. Document findings with photographs (calibrated scale in frame)
5. Mark suspect blades with chalk for detailed PT/MT inspection
6. Check blade attachment areas (T-root or dovetail configuration)

**Inspection Focus Areas:**
- Blade root (highest stress concentration)
- Leading edge (erosion from particle impingement)
- Trailing edge (corrosion, thinning)
- Blade tip (rubs, clearance loss)
- Shroud contact surfaces (wear patterns)

**Tools:**
- LED inspection lights (portable panels)
- Digital camera with macro lens
- Calibrated scale (for photo reference)
- Magnifying glass (10x minimum)
- Chalk markers

**Safety:**
- Wear cut-resistant gloves (blade edges are sharp)
- Use fall protection if working on elevated turbine deck

**Expected Result:**
- All blades visually inspected
- Suspect areas identified and marked
- Photographic documentation complete

---

### Step 4: PT/MT Inspection (90 min)

**Actions:**
1. Clean marked blades with solvent (remove oil, grease, contaminants)
2. Apply penetrant dye to suspect areas
3. Wait for dwell time per PT procedure (typically 15 minutes)
4. Remove excess penetrant with cleaner
5. Apply developer (white powder or spray)
6. Inspect for crack indications (red dye lines visible on white background)
7. For magnetic particle testing (ferromagnetic blades):
   - Apply magnetic field using yoke
   - Spray magnetic particle suspension
   - Inspect for particle accumulation indicating cracks
8. Measure crack length if detected (use calibrated scale)
9. Document all indications with photographs
10. Clean inspection area after completion

**PT/MT Acceptance Criteria:**
- Zero cracks >1mm length in blade root area
- Surface cracks <3mm acceptable in non-critical areas (subject to engineering review)
- Any subsurface indications require immediate engineering review

**Tools:**
- PT kit (penetrant, cleaner, developer)
- MT kit (magnetic yoke, particle suspension)
- Solvent cleaning rags
- Calibrated crack measurement scale
- UV lamp (for fluorescent penetrant, optional)

**Safety:**
- Use in ventilated area (solvent fumes)
- Wear chemical-resistant gloves

**Expected Result:**
- All marked blades inspected per PT/MT procedure
- Crack indications documented and measured
- Acceptance criteria verified

**Common Issues:**
- Lighting quality critical for crack detection - inadequate lighting misses small cracks
- PT indications sometimes difficult to interpret - consult Level II inspector if uncertain

---

### Step 5: Dimensional Checks (45 min)

**Actions:**
1. Select sample blades for dimensional verification (minimum 10% of total)
2. Measure blade length (root to tip) using micrometer
3. Measure blade chord (leading to trailing edge) at 3 locations
4. Measure blade thickness at critical sections
5. Compare measurements to baseline data (as-new dimensions)
6. Calculate material loss percentage
7. Document dimensional changes on inspection form TURB-DIM-001

**Measurement Locations:**
- Blade length: root to tip centerline
- Chord: at 25%, 50%, 75% of blade height
- Thickness: at leading edge, mid-chord, trailing edge

**Dimensional Acceptance Criteria:**
- Blade length: -0.5mm maximum from baseline
- Chord: -1.0mm maximum from baseline (erosion limit)
- Thickness: -10% maximum from baseline

**Tools:**
- Micrometers (0-25mm, 25-50mm, 50-75mm)
- Calipers (0-150mm)
- Blade measurement template (specific to turbine model)
- Inspection form TURB-DIM-001

**Safety:**
- Secure blades during measurement (prevent rotation or movement)

**Expected Result:**
- Sample blade dimensions verified
- Dimensional changes within acceptance criteria
- Excessive wear identified for engineering review

---

### Step 6: Blade Tip Clearance (30 min)

**Actions:**
1. Measure radial clearance between blade tips and casing (circumferential)
2. Use feeler gauges at 8 positions around circumference (45° intervals)
3. Record clearance at each position
4. Calculate average clearance and maximum deviation
5. Compare to design clearance specification
6. Check for rub marks on casing (indicates clearance loss)

**Tip Clearance Specification:**
- Design clearance: 2.5mm ±0.5mm
- Maximum acceptable deviation: ±1.0mm from average
- Rub marks indicate clearance <1.0mm (requires investigation)

**Tools:**
- Feeler gauge set (0.5-5.0mm range)
- Flashlight for visual inspection
- Clearance measurement form TURB-CLR-001

**Safety:**
- Verify turbine cannot rotate during measurement

**Expected Result:**
- Tip clearance measured at 8 positions
- Average clearance within specification
- No rub marks indicating clearance loss

---

### Step 7: Casing Closure (75 min)

**Actions:**
1. Perform final FOD (foreign object debris) inspection
2. Remove all tools, rags, and inspection equipment from turbine
3. Verify blade locking wires intact (replace if damaged)
4. Clean casing mating surfaces with solvent
5. Inspect casing gasket (replace if damaged or compressed >20%)
6. Position new gasket on lower casing half
7. Lift upper casing half using hoist
8. Lower carefully onto lower half (align dowel pins)
9. Install casing bolts finger-tight in spiral pattern (reverse of removal)
10. Torque bolts to specification in 3 passes (spiral pattern):
    - Pass 1: 200 Nm
    - Pass 2: 350 Nm
    - Pass 3: 480 Nm
11. Mark bolts with torque paint for verification

**Torque Sequence (Spiral Pattern):**
```
Start at top dead center (TDC), work outward in spiral:
TDC → TDC+15° → TDC-15° → TDC+30° → TDC-30° → continue outward
Same pattern as removal but in reverse order
```

**Tools:**
- Torque wrench 50-500 Nm (calibrated <6 months)
- Casing gasket (from kit GSKT-TURB-001)
- Chain hoist 2500kg capacity
- Solvent and cleaning rags
- Torque paint marker

**Safety:**
⚠️ **CRITICAL:** FOD left inside turbine can cause catastrophic failure
⚠️ Use calibrated torque wrench only
⚠️ Never work under suspended casing

**Expected Result:**
- Casing closed and sealed
- All bolts torqued to 480 Nm ±10 Nm
- FOD inspection documented (zero items left inside)
- Torque paint marks visible

---

### Step 8: Alignment Verification (30 min)

**Actions:**
1. Install dial indicators on turbine shaft (axial and radial)
2. Rotate shaft manually through 360° using barring device
3. Record dial indicator readings at 90° intervals
4. Verify shaft runout within specification (<0.15mm total indicator reading)
5. Check coupling alignment to generator (if accessible)
6. Document alignment data on form TURB-ALIGN-001

**Alignment Acceptance Criteria:**
- Axial runout: <0.10mm TIR
- Radial runout: <0.15mm TIR
- Coupling offset: <0.20mm

**Tools:**
- Dial indicators (0.01mm resolution)
- Magnetic bases for indicator mounting
- Barring device
- Alignment form TURB-ALIGN-001

**Safety:**
- Verify LOTO still in place during rotation check

**Expected Result:**
- Shaft alignment verified within specification
- No binding or unusual resistance during manual rotation
- Alignment data documented

---

## 6. Final Checkpoints

- [ ] All blades visually inspected
- [ ] PT/MT inspection completed on marked blades
- [ ] Zero cracks >1mm in critical areas
- [ ] Dimensional checks within acceptance criteria
- [ ] Tip clearance 2.5mm ±0.5mm average
- [ ] FOD inspection completed (zero items left inside)
- [ ] Casing bolts torqued to 480 Nm
- [ ] Shaft alignment verified (<0.15mm runout)
- [ ] LOTO removed and documented
- [ ] Inspection forms completed (TURB-DIM-001, TURB-CLR-001, TURB-ALIGN-001)
- [ ] Tools returned to crib

## 7. References
- ASME PTC 6 (Steam Turbines)
- EPRI Turbine Blade Inspection Guidelines (TR-103824)
- ISO 10437 (Steam Turbines for Petroleum Applications)
- ASTM E1417 (Liquid Penetrant Testing)
- ASTM E1444 (Magnetic Particle Testing)

## 8. Revision History
- v4.0 (2024-09-10): Updated torque specifications following OEM bulletin TB-2024-05
- v3.5 (2024-05-20): Added detailed PT/MT acceptance criteria
- v3.0 (2023-12-01): Revised casing bolt removal sequence (spiral pattern)
- v2.5 (2023-08-15): Added blade tip clearance measurement procedure
