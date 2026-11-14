import { Activity, Brain, Heart, ShieldAlert, Thermometer, Wind } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { subsystems, type SubsystemId, type TelemetryPoint, type Vitals } from "@/lib/mission-data";

const fmt = (value: number) => Number.isInteger(value) ? `${value}` : value.toFixed(1);

export function TelemetryPanels({ telemetry, vitals, anomalyActive, activeSubsystem, onSelectSubsystem }: {
  telemetry: TelemetryPoint[]; vitals: Vitals; anomalyActive: boolean; activeSubsystem: SubsystemId | null; onSelectSubsystem: (id: SubsystemId | null) => void;
}) {
  const cards = [
    { label: "Heart rate", value: fmt(vitals.hr), unit: "BPM", baseline: "55–95 BPM", status: vitals.hr > 120 ? "CRITICAL" : vitals.hr > 95 ? "ELEVATED" : "NOMINAL", id: "THORAX_CARDIO" as const, icon: Heart },
    { label: "Core temperature", value: vitals.temp.toFixed(1), unit: "°C", baseline: "36.5–37.5 °C", status: vitals.temp > 38 ? "CRITICAL" : vitals.temp > 37.5 ? "ELEVATED" : "NOMINAL", id: "THORAX_CARDIO" as const, icon: Thermometer },
    { label: "Intracranial", value: vitals.icp.toFixed(1), unit: "mmHg", baseline: "< 15.0 mmHg", status: vitals.icp > 18 ? "CRITICAL" : vitals.icp > 15 ? "ELEVATED" : "NOMINAL", id: "CRANIUM_SANS" as const, icon: Brain },
    { label: "Dosimetry rate", value: vitals.radiation.toFixed(2), unit: "mSv/d", baseline: "< 0.50 mSv/d", status: vitals.radiation > 2 ? "CRITICAL" : vitals.radiation > 0.5 ? "ELEVATED" : "NOMINAL", id: "SUIT_DOSIMETRY" as const, icon: ShieldAlert },
  ];
  return (
    <section className="telemetry-column" aria-label="Simulated biometric telemetry">
      <div className="telemetry-section-heading"><div><span className="section-index">01 / CREW PHYSIOLOGY</span><h2>Biometric stream</h2></div><span className="sample-frequency"><Activity size={13} /> LIVE SIM</span></div>
      <div className="vitals-grid">
        {cards.map(({ label, value, unit, baseline, status, id, icon: Icon }) => <button type="button" key={label} className={`vital-tile ${status === "CRITICAL" ? "vital-critical" : ""} ${activeSubsystem === id ? "vital-selected" : ""}`} onClick={() => onSelectSubsystem(activeSubsystem === id ? null : id)}>
          <div className="vital-top"><span className="vital-label"><Icon size={14} />{label}</span><span className={`status status-${status.toLowerCase()}`}>{status}</span></div>
          <div className="vital-reading">{value}<small>{unit}</small></div><span className="vital-baseline">BASE {baseline}</span>
        </button>)}
      </div>
      <article className="chart-panel"><div className="chart-heading"><div><span className="chart-label">CARDIAC SIGNAL</span><h3>Lead-II waveform</h3><p>Simulated ECG · rolling 60-point window</p></div><span className={`chart-value ${anomalyActive ? "text-alert" : ""}`}>{vitals.hr}<small> BPM</small></span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><LineChart data={telemetry}><CartesianGrid vertical={false} stroke="var(--line-soft)" strokeDasharray="3 5" /><XAxis dataKey="time" hide /><YAxis domain={[-1.4, 2.5]} hide /><ReferenceLine y={0} stroke="var(--line)" strokeDasharray="3 4" /><Line type="monotone" dataKey="ecg" stroke={anomalyActive ? "var(--critical)" : "var(--teal)"} strokeWidth={2.2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
      </article>
      <article className="chart-panel oxygen-panel"><div className="chart-heading"><div><span className="chart-label">OXYGENATION</span><h3>Arterial saturation</h3><p>Reference line · 92% training threshold</p></div><span className={`chart-value ${vitals.spo2 < 92 ? "text-alert" : "text-teal"}`}>{vitals.spo2.toFixed(1)}<small>%</small></span></div>
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={telemetry}><defs><linearGradient id="spo2-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={anomalyActive ? "var(--critical)" : "var(--teal)"} stopOpacity={0.28} /><stop offset="96%" stopColor={anomalyActive ? "var(--critical)" : "var(--teal)"} stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line-soft)" strokeDasharray="3 5" /><XAxis dataKey="time" hide /><YAxis domain={[86, 100]} hide /><ReferenceLine y={92} stroke="var(--critical)" strokeDasharray="4 4" /><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "4px", fontFamily: "var(--font-mono)", fontSize: 11 }} /><Area type="monotone" dataKey="spo2" stroke={anomalyActive ? "var(--critical)" : "var(--teal)"} strokeWidth={2} fill="url(#spo2-fill)" isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>
      </article>
      <div className="subsystem-index"><span className="chart-label">TRACKED SYSTEMS</span>{subsystems.map((spot, index) => <Button key={spot.id} variant="ghost" className="subsystem-row" onClick={() => onSelectSubsystem(activeSubsystem === spot.id ? null : spot.id)}><span className="subsystem-number">0{index + 1}</span><span className="subsystem-name">{spot.label}</span><span className="subsystem-arrow">↗</span></Button>)}</div>
    </section>
  );
}

export function EnvironmentStrip({ vitals, anomalyActive }: { vitals: Vitals; anomalyActive: boolean }) {
  const items = [{ label: "Cabin pCO₂", value: vitals.co2.toFixed(1), unit: "mmHg", alert: vitals.co2 >= 4 }, { label: "Cabin O₂", value: vitals.o2.toFixed(1), unit: "%", alert: false }, { label: "Femoral BMD", value: vitals.bmd.toFixed(1), unit: "% / mo", alert: vitals.bmd <= -1 }];
  return <article className="environment-panel"><div className="environment-heading"><div><Wind size={15} /><span>Environmental systems</span></div><span className={`eva-state ${anomalyActive ? "eva-hold" : ""}`}>{anomalyActive ? "EVA · NO-GO" : "EVA · GO"}</span></div><div className="environment-grid">{items.map((item) => <div className="environment-value" key={item.label}><span>{item.label}</span><strong className={item.alert ? "text-alert" : ""}>{item.value}<small> {item.unit}</small></strong></div>)}</div></article>;
}
