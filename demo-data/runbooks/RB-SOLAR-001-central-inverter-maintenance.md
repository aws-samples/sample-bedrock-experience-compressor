# RB-SOLAR-001: Central Inverter Maintenance

**Procedure Code:** PROC-SOLAR-INV-2024-001
**Runbook ID:** RB-SOLAR-001
**Version:** 1.5
**Date:** 2024-05-10
**Classification:** Preventive Maintenance - High Voltage Work

## 1. Objective
Quarterly preventive maintenance of central inverter units to ensure optimal DC-AC conversion efficiency and prevent component failure.

## 2. Prerequisites
- Inverter shutdown scheduled (coordinate with grid operator)
- Electrical isolation verified at DC and AC disconnects
- High voltage work permit obtained
- Arc flash PPE available (40 cal/cm² minimum)
- Firmware update files downloaded and verified (checksum validation)
- Insulation tester calibrated (<12 months)

## 3. Required Tools
- Insulation resistance tester (Megger or equivalent, 1000V DC)
- Thermal camera (resolution minimum 160x120 pixels)
- Multimeter (true RMS, CAT III 1000V rated)
- Vacuum cleaner (ESD-safe, grounded)
- Torque screwdriver for terminal connections
- Laptop with manufacturer service software
- Arc flash PPE (suit, gloves, face shield)

## 4. Estimated Duration
**3 hours** (per inverter unit, typical 500 kW central inverter)

## 5. Safety Notes
⚠️ **CRITICAL SAFETY WARNINGS:**
- High voltage present (DC side up to 1000V, AC side 480V)
- Verify electrical isolation before opening inverter enclosure
- Capacitor banks retain charge up to 30 minutes after shutdown
- Arc flash hazard - wear appropriate PPE during live work
- ESD-sensitive components - use grounded tools and wrist strap
- Hot surfaces - inverter components may exceed 70°C

---

## STEP-BY-STEP PROCEDURE

### Step 1: Inverter Shutdown Sequence (15 min)

**Actions:**
1. Access inverter HMI (Human-Machine Interface) touchscreen
2. Record current operating parameters for baseline:
   - DC input voltage
   - DC input current
   - AC output voltage
   - AC output current
   - Power output (kW)
   - Efficiency (%)
   - Operating temperature (ambient, IGBT modules, capacitors)
3. Initiate controlled shutdown via HMI
4. Verify inverter stops producing power (AC output = 0V)
5. Open AC disconnect switch (lockable, at inverter enclosure)
6. Open DC disconnect switch (at combiner box or inverter input)
7. Verify disconnect switches locked open
8. Wait minimum 10 minutes for capacitor discharge

**Tools:**
- HMI access (touchscreen or laptop)
- Data recording form INV-DATA-001
- LOTO locks for disconnects

**Safety:**
⚠️ **CRITICAL:** Do not open inverter until both DC and AC disconnects locked open
⚠️ Wait 10 minutes minimum for capacitor discharge

**Expected Result:**
- Inverter powered down safely
- DC and AC disconnects locked open
- Operating parameters documented for comparison
- Ready for electrical isolation verification

---

### Step 2: Electrical Isolation (20 min)

**Actions:**
1. Don arc flash PPE (suit, gloves, face shield rated 40 cal/cm²)
2. Use multimeter to verify zero voltage at AC terminals (L1, L2, L3, N)
3. Use multimeter to verify zero voltage at DC terminals (DC+, DC-)
4. Apply LOTO tags to AC and DC disconnects per Form LOTO-SOLAR-001
5. Post warning signs on inverter enclosure
6. Discharge capacitor banks manually (if equipped with discharge resistors, verify operation)
7. Verify zero voltage again with multimeter after capacitor discharge
8. Apply grounding clamp to DC terminals (temporary protective ground)

**Voltage Verification Points:**
- AC side: L1-L2, L2-L3, L3-L1 (expect 0V)
- AC side: L1-N, L2-N, L3-N (expect 0V)
- DC side: DC+ to DC-, DC+ to ground, DC- to ground (expect 0V)

**Tools:**
- Multimeter (CAT III 1000V rated, true RMS)
- Arc flash PPE (40 cal/cm² minimum)
- LOTO tags and locks
- Temporary grounding clamp
- Warning signs

**Safety:**
⚠️ **CRITICAL:** Verify zero voltage before touching terminals
⚠️ Capacitors may retain charge - wait and verify
⚠️ Use one hand only when probing (keep other hand away from metal)

**Expected Result:**
- Zero voltage verified at all terminals
- LOTO applied and documented
- Temporary ground installed on DC side
- Safe to open inverter enclosure

---

### Step 3: Cooling System Check (30 min)

**Actions:**
1. Open inverter enclosure (remove front panel, typically 8-12 screws)
2. Inspect cooling fans (quantity depends on inverter model, typically 4-6 fans):
   - Visual inspection for damage or loose blades
   - Check fan mounting bolts tight
   - Verify fan rotation by hand (should spin freely)
3. Clean fan blades and guards with ESD-safe vacuum and compressed air
4. Inspect air filters (intake and exhaust):
   - Remove filters from housing
   - Check for dust accumulation (replace if >50% blocked)
   - Clean reusable filters or install new disposable filters
5. Inspect heat sink fins on IGBT modules:
   - Check for dust or debris accumulation
   - Clean with ESD-safe vacuum (do not use compressed air directly on IGBTs)
6. Check cooling air flow paths (no obstructions)
7. Verify enclosure seals intact (prevents dust ingress)

**Cooling System Acceptance:**
- Fans rotate freely without binding
- Filters clean or replaced
- Heat sinks free of dust accumulation
- Air flow paths clear

**Tools:**
- Screwdriver set (for enclosure panels)
- ESD-safe vacuum cleaner (grounded)
- Compressed air (low pressure, <30 psi)
- Replacement air filters (if needed)

**Safety:**
⚠️ Do not use high-pressure compressed air on electronic components (ESD risk)
⚠️ Wear ESD wrist strap when working inside enclosure

**Expected Result:**
- Cooling system cleaned and inspected
- Fans operational and free-spinning
- Air filters clean or replaced
- Heat sinks clean

**Common Issues:**
- Dust accumulation worse than expected in desert or agricultural environments
- Filters often overlooked in routine maintenance - leads to overheating

---

### Step 4: Capacitor Bank Inspection (25 min)

**Actions:**
1. Locate DC link capacitor bank (large cylindrical components, typically 4-8 capacitors)
2. Visual inspection for defects:
   - Bulging or swelling (indicates internal failure)
   - Leaking electrolyte (brown stains)
   - Cracked or damaged cases
   - Loose mounting bolts
3. Check capacitor terminal connections (torque screwdriver, tighten to 2.5 Nm)
4. Measure capacitance using capacitance meter (if available):
   - Compare to nameplate rating
   - Deviation >10% indicates degradation
5. Document capacitor voltage ratings and capacitance values
6. Mark date of inspection on each capacitor with permanent marker

**Capacitor Inspection Criteria:**
- No physical damage (bulging, leaking, cracks)
- Terminal connections tight (2.5 Nm torque)
- Capacitance within 10% of nameplate rating
- Voltage rating appropriate for system (typically 900-1200V DC)

**Tools:**
- Torque screwdriver (0.5-5 Nm range)
- Capacitance meter (optional)
- Inspection flashlight
- Permanent marker

**Safety:**
⚠️ Even discharged capacitors can have residual charge - verify zero voltage
⚠️ Do not touch terminals with bare hands

**Expected Result:**
- Capacitors in good condition (no swelling or leaks)
- Connections tight and secure
- Capacitance verified within specification

---

### Step 5: IGBT Module Cleaning (40 min)

**Actions:**
1. Locate IGBT (Insulated Gate Bipolar Transistor) power modules (typically 6 modules in 3-phase inverter)
2. Visual inspection:
   - Check for signs of overheating (discoloration, burn marks)
   - Inspect gate drive connections
   - Check thermal interface material condition (if accessible)
3. Clean IGBT heat sinks using ESD-safe vacuum:
   - Remove dust from fins carefully
   - Do not touch semiconductor surfaces
   - Vacuum between fins and around terminals
4. Inspect bus bars (DC+ and DC- connections to IGBTs):
   - Check for corrosion or oxidation
   - Verify torque on bus bar connections (manufacturer-specific, typically 8-12 Nm)
5. Check thermal sensors on IGBT modules (if equipped):
   - Verify sensor wiring intact
   - No loose connections
6. Photograph IGBT modules for documentation

**IGBT Inspection Acceptance:**
- No signs of overheating or damage
- Heat sinks clean and free of dust
- Bus bar connections tight (8-12 Nm)
- Thermal sensors functional

**Tools:**
- ESD-safe vacuum cleaner
- Torque screwdriver (for bus bar connections)
- Digital camera
- ESD wrist strap

**Safety:**
⚠️ **CRITICAL:** IGBTs are ESD-sensitive - use grounded tools and wrist strap
⚠️ Do not touch semiconductor surfaces

**Expected Result:**
- IGBT modules cleaned and inspected
- Heat sinks free of dust accumulation
- Bus bar connections verified tight
- No signs of overheating or damage

---

### Step 6: Firmware Update (30 min)

**Actions:**
1. Connect laptop to inverter control board (USB or Ethernet connection)
2. Launch manufacturer service software
3. Read current firmware version from inverter
4. Compare to latest firmware version (downloaded from manufacturer portal)
5. If update available, verify firmware file integrity (checksum validation)
6. Backup current inverter configuration (save to laptop)
7. Upload new firmware to inverter
8. Wait for firmware installation to complete (typically 10-15 minutes)
9. Verify firmware update successful (check version number post-update)
10. Restore configuration settings if needed
11. Disconnect laptop

**Firmware Update Precautions:**
- Do not interrupt power during update (risk of bricking control board)
- Verify firmware file compatible with inverter model and serial number
- Backup configuration before updating

**Tools:**
- Laptop with manufacturer service software installed
- USB or Ethernet cable
- Firmware update files (downloaded and verified)

**Safety:**
- No electrical hazards during this step (working with control board only)

**Expected Result:**
- Firmware updated to latest version
- Configuration settings preserved
- Inverter control system operational

**Common Issues:**
- Firmware compatibility issues - verify model and serial number match
- Configuration may reset during update - backup essential

---

### Step 7: Insulation Resistance Test (25 min)

**Actions:**
1. Disconnect temporary ground from DC terminals
2. Configure insulation tester for 1000V DC test
3. Test DC+ to ground (expect >1 MΩ minimum, typically >10 MΩ)
4. Test DC- to ground (expect >1 MΩ minimum, typically >10 MΩ)
5. Test AC L1, L2, L3 to ground (expect >1 MΩ minimum)
6. Test between DC+ and DC- (with external DC circuits disconnected, expect high resistance)
7. Document test results on form INS-TEST-001
8. Compare to previous test results (trending)

**Insulation Resistance Acceptance Criteria:**
- DC+ to ground: >1 MΩ minimum (>10 MΩ typical)
- DC- to ground: >1 MΩ minimum (>10 MΩ typical)
- AC phase to ground: >1 MΩ minimum
- Any reading <1 MΩ requires investigation (moisture, contamination, or insulation failure)

**Tools:**
- Insulation resistance tester (Megger, 1000V DC capability)
- Test leads
- Insulation test form INS-TEST-001

**Safety:**
⚠️ Insulation tester applies high voltage (1000V) - do not touch test points during test
⚠️ Verify all personnel clear of inverter before testing

**Expected Result:**
- Insulation resistance >1 MΩ all test points
- Results documented and compared to baseline
- No insulation degradation detected

---

### Step 8: Startup Sequence (35 min)

**Actions:**
1. Reinstall temporary ground on DC terminals
2. Close inverter enclosure (reinstall front panel)
3. Remove LOTO from DC disconnect
4. Close DC disconnect switch
5. Verify DC voltage present at inverter input (typically 600-900V DC)
6. Remove LOTO from AC disconnect
7. Close AC disconnect switch
8. Remove temporary ground from DC terminals
9. Power up inverter via HMI (startup sequence)
10. Monitor startup sequence on HMI:
    - Self-test completion (typically 30-60 seconds)
    - DC link voltage stabilization
    - Grid synchronization
    - Power ramp-up
11. Verify inverter reaches rated power output
12. Use thermal camera to scan inverter (check for hot spots):
    - IGBT modules should be <70°C
    - Capacitors should be <60°C
    - Transformers/inductors should be <80°C
13. Monitor for 15 minutes, verify stable operation
14. Record final operating parameters (compare to baseline from Step 1)

**Startup Acceptance Criteria:**
- Self-test passes (no fault codes)
- DC link voltage stable (within ±5% of nominal)
- AC output voltage stable (within ±2% of nominal)
- Power output reaches rated capacity
- No abnormal temperatures (all components within limits)
- Efficiency within 1% of baseline

**Tools:**
- Thermal camera (FLIR or equivalent)
- HMI access
- Data recording form INV-DATA-001

**Safety:**
⚠️ Remove temporary ground before energizing inverter
⚠️ Stand clear during initial startup (arc flash risk if fault present)

**Expected Result:**
- Inverter operational and producing power
- No fault codes or alarms
- Operating parameters match baseline
- Thermal scan shows no hot spots
- Ready to return to normal service

---

## 6. Final Checkpoints

- [ ] Inverter shutdown and isolated per LOTO procedure
- [ ] Cooling system cleaned (fans, filters, heat sinks)
- [ ] Capacitor bank inspected (no defects)
- [ ] IGBT modules cleaned and inspected
- [ ] Firmware updated to latest version
- [ ] Insulation resistance test passed (>1 MΩ all points)
- [ ] Inverter restarted successfully (no fault codes)
- [ ] Thermal scan completed (no hot spots)
- [ ] Operating parameters match baseline (efficiency, voltage, current)
- [ ] LOTO removed and documented
- [ ] Tools and equipment removed from work area
- [ ] Documentation completed (INV-DATA-001, INS-TEST-001)

## 7. References
- IEC 62109-1 (Safety of Power Converters for Photovoltaic Systems)
- IEEE 1547 (Interconnection of Distributed Energy Resources)
- NFPA 70E (Electrical Safety in the Workplace)
- Manufacturer Service Manual (model-specific procedures)

## 8. Revision History
- v1.5 (2024-05-10): Added detailed IGBT cleaning procedure
- v1.4 (2024-01-20): Updated firmware update procedure for new service software
- v1.3 (2023-09-15): Revised cooling system inspection (added filter replacement)
- v1.0 (2023-03-01): Initial release
