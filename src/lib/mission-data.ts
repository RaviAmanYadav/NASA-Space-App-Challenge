export type SubsystemId = "CRANIUM_SANS" | "THORAX_CARDIO" | "SUIT_DOSIMETRY" | "LOWER_EXTREMITIES";
export type CrewMember = { id: string; name: string; role: string; bloodType: string; massKg: number; baseHr: number; baseIcp: number };
export type Vitals = { hr: number; spo2: number; temp: number; icp: number; radiation: number; co2: number; o2: number; bmd: number };
export type TelemetryPoint = { time: number; ecg: number; spo2: number };

export const crewRoster = [
  { id: "AST-04-VANCE", name: "CDR. E. Vance", role: "Commander / CMO", bloodType: "O+", massKg: 78, baseHr: 66, baseIcp: 12.2 },
  { id: "AST-04-PATEL", name: "PLT. R. Patel", role: "Lunar/Mars Pilot", bloodType: "A+", massKg: 74, baseHr: 62, baseIcp: 11.8 },
  { id: "AST-04-CHEN", name: "MS1. L. Chen", role: "EVA & Payload Specialist", bloodType: "B-", massKg: 65, baseHr: 71, baseIcp: 12.6 },
] satisfies [CrewMember, CrewMember, CrewMember];

export const subsystems: { id: SubsystemId; shortName: string; label: string; metric: "icp" | "hr" | "co2" | "bmd"; unit: string; baseline: string; description: string }[] = [
  { id: "CRANIUM_SANS", shortName: "CRANIUM", label: "Cranium & Neuro-Ocular (SANS)", metric: "icp", unit: "mmHg", baseline: "11.0–15.0 mmHg", description: "Cephalad fluid shifts, optic nerve sheath, and cognitive fatigue." },
  { id: "THORAX_CARDIO", shortName: "THORAX", label: "Thorax & Cardiopulmonary", metric: "hr", unit: "BPM", baseline: "55–95 BPM", description: "ECG telemetry, oxygenation, and jugular venous flow screening." },
  { id: "SUIT_DOSIMETRY", shortName: "SUIT / ECLSS", label: "Suit ECLSS & Dosimetry", metric: "co2", unit: "mmHg", baseline: "< 2.0 mmHg", description: "Personal dosimetry, suit oxygen, and cabin CO₂ scrubbers." },
  { id: "LOWER_EXTREMITIES", shortName: "EXTREMITIES", label: "Musculoskeletal & BMD", metric: "bmd", unit: "%/mo", baseline: "−0.2% / month", description: "Femoral bone mineral density and resistive exercise compliance." },
];

export const protocols = {
  NOMINAL: {
    code: "NASA-STD-3001-NOM", title: "All Physiological Subsystems Nominal", confidence: 99.4, severity: "NOMINAL", drawer: "Routine countermeasures only",
    summary: "Simulated crew readings are within individualized pre-flight baselines. Continue scheduled exercise, hydration, and circadian routines.",
    steps: ["Complete a 90-minute resistive exercise block at the scheduled target load.", "Maintain the planned daily hydration and electrolyte schedule.", "Use the scheduled blue-depleted cabin lighting before the sleep window."],
  },
  THORAX_CARDIO: {
    code: "NPD-8900.5B-CARD-04", title: "Tachyarrhythmia & Hypoxia Scenario", confidence: 96.8, severity: "CRITICAL", drawer: "ALS Sub-Pack B · Drawer 02",
    summary: "Training scenario: simulated elevated heart rate, reduced SpO₂, and increased cabin CO₂. This display is not a medical device or care recommendation.",
    steps: ["Training prompt: secure the simulated crew member in the restraint system.", "Training prompt: review the supplemental oxygen and cabin scrubber status.", "Training prompt: inspect the simulated diagnostic ECG and AED indicators.", "Training prompt: review the mission medical reference before any real-world action."],
  },
  CRANIUM_SANS: {
    code: "OCHMO-TB-009-SANS", title: "Neuro-Ocular (SANS) Scenario", confidence: 93.2, severity: "ELEVATED", drawer: "Diagnostic Kit A · Drawer 04",
    summary: "Training scenario: simulated neuro-ocular measurements cross a demonstration threshold. This display is not a medical device or treatment guide.",
    steps: ["Training prompt: review the simulated neuro-ocular measurements.", "Training prompt: check the mission health reference for current procedures.", "Training prompt: record observations for the training scenario.", "Training prompt: review the selected crew member's demonstration baseline."],
  },
  SUIT_DOSIMETRY: {
    code: "ALARA-SPE-ALERT-01", title: "Radiation & Hypercapnia Scenario", confidence: 98.1, severity: "CRITICAL", drawer: "Shelter / ECLSS Panel 3",
    summary: "Training scenario: simulated radiation and cabin CO₂ values are elevated. This display is not an operational alert or medical guidance.",
    steps: ["Training prompt: review the simulated shelter and EVA status indicators.", "Training prompt: inspect the demonstration shielding inventory.", "Training prompt: review simulated scrubber readings and mission references."],
  },
  LOWER_EXTREMITIES: {
    code: "ARED-BMD-COUNTER-02", title: "Bone Density Scenario", confidence: 91.5, severity: "ELEVATED", drawer: "Nutritional Countermeasure Locker D",
    summary: "Training scenario: simulated femoral density values cross a demonstration threshold. This display is not clinical guidance.",
    steps: ["Training prompt: review the simulated resistive exercise log.", "Training prompt: inspect the demonstration nutrition and biomarker panel.", "Training prompt: record bilateral ultrasound status for this scenario."],
  },
} satisfies Record<string, { code: string; title: string; confidence: number; severity: "NOMINAL" | "ELEVATED" | "CRITICAL"; drawer: string; summary: string; steps: string[] }>;

export const initialVitals = (crew: CrewMember): Vitals => ({ hr: crew.baseHr, spo2: 98.4, temp: 36.8, icp: crew.baseIcp, radiation: 0.32, co2: 1.4, o2: 20.9, bmd: -0.3 });

export function makeInitialTelemetry(): TelemetryPoint[] {
  return Array.from({ length: 40 }, (_, i) => ({ time: i, ecg: Math.sin(i * 0.6) * 0.25, spo2: 98.1 + Math.sin(i * 0.2) * 0.25 }));
}

export function formatMissionTime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${days}d ${hours}:${minutes}:${seconds}`;
}

export function getProtocolKey(activeSubsystem: SubsystemId | null, anomalyActive: boolean) {
  return activeSubsystem ?? (anomalyActive ? "THORAX_CARDIO" : "NOMINAL");
}

export function nextSimulatedVitals(crew: CrewMember, anomalyActive: boolean): Vitals {
  if (anomalyActive) return { hr: Math.round(134 + (Math.random() * 8 - 4)), spo2: Number((90.4 + (Math.random() * 1.2 - 0.6)).toFixed(1)), temp: Number((37.9 + (Math.random() * 0.2 - 0.1)).toFixed(1)), icp: Number((19.2 + (Math.random() * 0.6 - 0.3)).toFixed(1)), radiation: Number((2.45 + (Math.random() * 0.2 - 0.1)).toFixed(2)), co2: Number((4.2 + (Math.random() * 0.2 - 0.1)).toFixed(1)), o2: 19.4, bmd: -1.5 };
  return { hr: Math.round(crew.baseHr + (Math.random() * 4 - 2)), spo2: Number((98.3 + (Math.random() * 0.6 - 0.3)).toFixed(1)), temp: Number((36.8 + (Math.random() * 0.1 - 0.05)).toFixed(1)), icp: Number((crew.baseIcp + (Math.random() * 0.4 - 0.2)).toFixed(1)), radiation: 0.32, co2: Number((1.4 + (Math.random() * 0.1 - 0.05)).toFixed(1)), o2: 20.9, bmd: -0.3 };
}
