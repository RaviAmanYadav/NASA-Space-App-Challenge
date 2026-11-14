import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Check,
  CheckCircle2,
  Circle,
  Cpu,
  Radio,
  ShieldCheck,
  UploadCloud,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  crewRoster,
  protocols,
  type CrewMember,
  type SubsystemId,
} from "@/lib/mission-data";

type Props = {
  anomalyActive: boolean;
  activeSubsystem: SubsystemId | null;
  selectedCrew: CrewMember;
  onSelectProtocol: (id: SubsystemId | null) => void;
  onSelectCrew: (crew: CrewMember) => void;
  onOpenPvt: () => void;
  pvtScore: number;
  dsnBatchCount: number;
  onClearDsn: () => void;
};

const protocolTabs: { id: SubsystemId | null; label: string }[] = [
  { id: null, label: "AUTO" },
  { id: "THORAX_CARDIO", label: "CARDIO" },
  { id: "CRANIUM_SANS", label: "SANS" },
  { id: "SUIT_DOSIMETRY", label: "SPE / CO₂" },
  { id: "LOWER_EXTREMITIES", label: "BMD" },
];

export function TriagePanel({
  anomalyActive,
  activeSubsystem,
  selectedCrew,
  onSelectProtocol,
  onSelectCrew,
  onOpenPvt,
  pvtScore,
  dsnBatchCount,
  onClearDsn,
}: Props) {
  const protocolKey =
    activeSubsystem ?? (anomalyActive ? "THORAX_CARDIO" : "NOMINAL");
  const protocol = protocols[protocolKey] ?? protocols["NOMINAL"];
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );
  const [transmitting, setTransmitting] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCompletedSteps({});
  }, [protocol.code, selectedCrew.id]);

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  const flushDsn = () => {
    if (transmitting || dsnBatchCount === 0) return;
    setTransmitting(true);
    timeout.current = setTimeout(() => {
      onClearDsn();
      setTransmitting(false);
    }, 1000);
  };

  return (
    <div className="mission-right-column">
      <article
        className={`triage-panel severity-${protocol.severity.toLowerCase()}`}
      >
        <div className="triage-header">
          <div className="triage-title">
            <span className="triage-icon">
              <Cpu size={17} />
            </span>
            <div>
              <span className="section-index">
                03 / DECISION SUPPORT · SIMULATED
              </span>
              <h2>{protocol.title}</h2>
            </div>
          </div>
          <span className="confidence">
            {protocol.confidence}%<small>MODEL</small>
          </span>
        </div>
        <div
          className="protocol-tabs"
          role="group"
          aria-label="Training scenario selection"
        >
          {protocolTabs.map((tab) => (
            <Button
              key={tab.label}
              variant={activeSubsystem === tab.id ? "default" : "outline"}
              size="sm"
              className="protocol-tab"
              onClick={() => onSelectProtocol(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="crew-identification">
          <label htmlFor="crew-select-trigger">CREW MEMBER</label>
          <Select
            value={selectedCrew.id}
            onValueChange={(value) => {
              const crew = crewRoster.find((person) => person.id === value);
              if (crew) onSelectCrew(crew);
            }}
          >
            <SelectTrigger
              id="crew-select-trigger"
              className="crew-select-trigger"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {crewRoster.map((crew) => (
                <SelectItem key={crew.id} value={crew.id}>
                  {crew.name} · {crew.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            {selectedCrew.massKg} kg <i>·</i> {selectedCrew.bloodType}
          </span>
        </div>
        <div className="protocol-info">
          <span className="protocol-code">{protocol.code}</span>
          <span className="kit-location">KIT · {protocol.drawer}</span>
        </div>
        <p className="protocol-summary">{protocol.summary}</p>
        <div className="checklist-heading">
          <span className="section-index">TRAINING CHECKLIST</span>
          <span>
            {Object.values(completedSteps).filter(Boolean).length}/
            {protocol.steps.length} CHECKED
          </span>
        </div>
        <div className="checklist-items">
          {protocol.steps.map((step, index) => {
            const key = `${protocol.code}-${index}`;
            const done = Boolean(completedSteps[key]);
            return (
              <button
                key={key}
                type="button"
                className={`checklist-step ${done ? "step-complete" : ""}`}
                onClick={() =>
                  setCompletedSteps((current) => ({
                    ...current,
                    [key]: !current[key],
                  }))
                }
                aria-pressed={done}
              >
                <span className="step-marker">
                  {done ? <Check size={13} /> : <span>0{index + 1}</span>}
                </span>
                <span>{step}</span>
                <span className="step-check" aria-hidden="true">
                  {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="triage-utility-row">
          <Button variant="outline" className="pvt-button" onClick={onOpenPvt}>
            <Zap size={14} /> PVT REFLEX <strong>{pvtScore} ms</strong>
          </Button>
          <span className="triage-simulation-badge">
            <Activity size={12} /> TRAINING ONLY
          </span>
        </div>
        <div className="dsn-queue">
          <div className="dsn-queue-icon">
            <ShieldCheck size={15} />
          </div>
          <div className="dsn-queue-copy">
            <span>Store-and-forward queue</span>
            <strong>
              <Radio size={12} />
              {dsnBatchCount.toString().padStart(2, "0")} demonstration packets
            </strong>
          </div>
          <Button
            variant="default"
            size="sm"
            className="batch-button"
            disabled={transmitting || dsnBatchCount === 0}
            onClick={flushDsn}
          >
            <UploadCloud size={13} />
            {transmitting ? "Sending…" : "Batch uplink"}
          </Button>
        </div>
      </article>
    </div>
  );
}

export function ReflexTest({
  onClose,
  onSaveScore,
}: {
  onClose: () => void;
  onSaveScore: (score: number) => void;
}) {
  const [state, setState] = useState<
    "IDLE" | "WAITING" | "STIMULUS" | "FALSE_START" | "RESULT"
  >("IDLE");
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState([238, 229]);
  const startAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const average = Math.round(
    history.reduce((sum, value) => sum + value, 0) / history.length,
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const startTrial = () => {
    if (timer.current) clearTimeout(timer.current);
    setState("WAITING");
    setResult(null);
    timer.current = setTimeout(
      () => {
        startAt.current = performance.now();
        setState("STIMULUS");
      },
      1400 + Math.random() * 2400,
    );
  };

  const respond = () => {
    if (state === "WAITING") {
      if (timer.current) clearTimeout(timer.current);
      setState("FALSE_START");
    } else if (state === "STIMULUS") {
      const score = Math.round(performance.now() - startAt.current);
      setResult(score);
      setHistory((current) => [...current, score]);
      setState("RESULT");
      onSaveScore(score);
    }
  };

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        className="reflex-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reflex-title"
      >
        <header className="reflex-header">
          <div>
            <span className="section-index">
              NEUROCOGNITIVE TRAINING · FR-COG-01
            </span>
            <h2 id="reflex-title">
              <Zap size={17} /> Psychomotor vigilance
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Close reflex test"
          >
            ×
          </Button>
        </header>
        <p className="reflex-warning">
          Demonstration only — results are simulated, not clinical measurements.
        </p>
        <div className="reflex-stage">
          {state === "IDLE" && (
            <Button
              variant="outline"
              className="reflex-action reflex-idle"
              onClick={startTrial}
            >
              <span>START TRIAL</span>
              <small>Tap when the signal turns green</small>
            </Button>
          )}
          {state === "WAITING" && (
            <Button
              variant="secondary"
              className="reflex-action reflex-waiting"
              onClick={respond}
            >
              <span>HOLD STEADY</span>
              <small>Wait for the signal</small>
            </Button>
          )}
          {state === "STIMULUS" && (
            <Button
              variant="default"
              className="reflex-action reflex-stimulus"
              onClick={respond}
            >
              <span>RESPOND</span>
              <small>Tap now</small>
            </Button>
          )}
          {state === "FALSE_START" && (
            <Button
              variant="outline"
              className="reflex-action reflex-early"
              onClick={startTrial}
            >
              <span>EARLY RESPONSE</span>
              <small>Tap to run another trial</small>
            </Button>
          )}
          {state === "RESULT" && (
            <div className="reflex-result">
              <CheckCircle2 size={24} />
              <strong>{result} ms</strong>
              <span>
                {result !== null && result < 280
                  ? "Within demonstration range"
                  : "Above demonstration range"}
              </span>
              <Button variant="outline" size="sm" onClick={startTrial}>
                Next trial
              </Button>
            </div>
          )}
        </div>
        <footer className="reflex-stats">
          <span>{history.length} DEMONSTRATION TRIALS</span>
          <strong>SESSION MEAN · {average} ms</strong>
        </footer>
      </section>
    </div>
  );
}
