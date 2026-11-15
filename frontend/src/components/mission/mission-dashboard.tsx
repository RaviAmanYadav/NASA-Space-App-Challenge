import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Crosshair,
  Radio,
  ShieldAlert,
  Signal,
  UserRoundPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AstronautViewport } from "@/components/mission/astronaut-viewport";
import {
  EnvironmentStrip,
  TelemetryPanels,
} from "@/components/mission/telemetry-panels";
import { ReflexTest, TriagePanel } from "@/components/mission/triage-panel";
import {
  crewRoster,
  formatMissionTime,
  getProtocolKey,
  initialVitals,
  makeInitialTelemetry,
  nextSimulatedVitals,
  type CrewMember,
  type SubsystemId,
} from "@/lib/mission-data";
import { getAstronauts, type Astronaut } from "@/lib/astronaut-api";

export function MissionDashboard() {
  const [selectedCrew, setSelectedCrew] = useState<CrewMember>(crewRoster[0]);
  const [anomalyActive, setAnomalyActive] = useState(false);
  const [activeSubsystem, setActiveSubsystem] = useState<SubsystemId | null>(
    null,
  );
  const [pvtOpen, setPvtOpen] = useState(false);
  const [lastPvtScore, setLastPvtScore] = useState(234);
  const [dsnBatchCount, setDsnBatchCount] = useState(14);
  const [metSeconds, setMetSeconds] = useState(12334184);
  const [vitals, setVitals] = useState(() => initialVitals(crewRoster[0]));
  const [telemetry, setTelemetry] = useState(makeInitialTelemetry);
  const [astronaut, setAstronaut] = useState<Astronaut[]>([]);
  const [loadingAstronaut, setLoadingAstronaut] = useState(true);
  const [astronautError, setAstronautError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setMetSeconds((value) => value + 1);
      setVitals(nextSimulatedVitals(selectedCrew, anomalyActive));
      setTelemetry((current) => {
        const nextIndex = (current.at(-1)?.time ?? -1) + 1;
        const phase = nextIndex % 6;
        let ecg = Math.random() * 0.14 - 0.07;
        if (phase === 1) ecg = 0.28;
        if (phase === 2) ecg = anomalyActive ? 2.25 : 1.7;
        if (phase === 3) ecg = anomalyActive ? -1.15 : -0.68;
        if (phase === 4) ecg = 0.38;
        const spo2 = anomalyActive
          ? 90.2 + Math.random() * 1.2
          : 98.1 + Math.random() * 0.7;
        return [
          ...current.slice(1),
          { time: nextIndex, ecg, spo2: Number(spo2.toFixed(1)) },
        ];
      });
    }, 600);
    return () => clearInterval(interval);
  }, [selectedCrew, anomalyActive]);

  const protocolKey = useMemo(
    () => getProtocolKey(activeSubsystem, anomalyActive),
    [activeSubsystem, anomalyActive],
  );

  const selectCrew = (crew: CrewMember) => {
    setSelectedCrew(crew);
    if (!anomalyActive)
      setVitals((current) => ({
        ...current,
        hr: crew.baseHr,
        icp: crew.baseIcp,
      }));
  };

  const toggleAnomaly = () => {
    const active = !anomalyActive;
    setAnomalyActive(active);
    setActiveSubsystem(active ? "THORAX_CARDIO" : null);
    setDsnBatchCount((count) => count + 4);
  };

  const cycleCrew = () => {
    const currentIndex = crewRoster.findIndex(
      (member) => member.id === selectedCrew.id,
    );
    const nextCrew = crewRoster[(currentIndex + 1) % crewRoster.length];
    if (nextCrew) selectCrew(nextCrew);
  };

  useEffect(() => {
    async function loadAstronaut() {
      try {
        const data = await getAstronauts();

        console.log("Astronaut Data:", data);

        setAstronaut(data);
      } catch (error) {
        console.error("Astronaut API Error:", error);

        setAstronautError(
          error instanceof Error ? error.message : "Unable to load astronaut",
        );
      } finally {
        setLoadingAstronaut(false);
      }
    }

    loadAstronaut();
  }, []);

  return (
    <main className="mission-shell" data-protocol={protocolKey}>
      <header
        className={`mission-header ${anomalyActive ? "mission-header-alert" : ""}`}
      >
        <div className="brand-block">
          <div className="brand-mark">
            <Activity size={18} />
          </div>
          <div className="brand-copy">
            <div className="brand-eyebrow">
              <span>FLIGHT MEDICINE / TRAINING CONSOLE</span>
              <span className="brand-divider">·</span>
              <span className="mission-time">
                MET {formatMissionTime(metSeconds)}
              </span>
            </div>
            <h1>Deep-space crew health telemetry</h1>
          </div>
        </div>
        <div className="header-controls">
          <div className="comms-indicator">
            <Radio size={15} />
            <div>
              <span>DSN ONE-WAY LIGHT TIME</span>
              <strong>
                14m 22s <i>·</i> edge simulation
              </strong>
            </div>
          </div>
          <Button variant="outline" className="astronaut-entry-button" asChild>
            <Link to="/astronauts/new">
              <UserRoundPlus size={14} />
              <span>ADD ASTRONAUT</span>
            </Link>
          </Button>
          <Button variant="outline" className="crew-button" onClick={cycleCrew}>
            <Crosshair size={15} />
            <span>{selectedCrew.name}</span>
            <span className="crew-role">{selectedCrew.role}</span>
          </Button>
          <Button
            variant="outline"
            className="header-pvt"
            onClick={() => setPvtOpen(true)}
          >
            PVT REFLEX <strong>{lastPvtScore} ms</strong>
          </Button>
          <Button
            variant={anomalyActive ? "default" : "destructive"}
            className="emergency-button"
            onClick={toggleAnomaly}
          >
            <AlertTriangle size={14} />
            {anomalyActive ? "CLEAR SCENARIO" : "INJECT SCENARIO"}
          </Button>
        </div>
      </header>
      <div className="simulation-banner">
        <span className="simulation-symbol">
          <ShieldAlert size={15} />
        </span>
        <div>
          <strong>SIMULATION ONLY</strong>
          <span>
            All crew identities, telemetry, thresholds, and recommendations are
            fictional training data. Not connected to NASA or live sensors. Not
            for clinical or operational use.
          </span>
        </div>
        <span className="simulation-pulse">
          <Signal size={13} /> LOCAL DEMO
        </span>
      </div>
      <div className="mission-layout">
        <TelemetryPanels
          telemetry={telemetry}
          vitals={vitals}
          anomalyActive={anomalyActive}
          activeSubsystem={activeSubsystem}
          onSelectSubsystem={setActiveSubsystem}
        />
        <section className="center-column">
          <div className="center-label">
            <span className="section-index">02 / CREW DIGITAL TWIN</span>
            <span className="view-state">
              <span className="view-state-dot" /> SIMULATION ACTIVE
            </span>
          </div>
          <AstronautViewport
            vitals={vitals}
            anomalyActive={anomalyActive}
            activeSubsystem={activeSubsystem}
            onSelectSubsystem={setActiveSubsystem}
          />
          <div className="crew-caption">
            <div className="crew-avatar">{selectedCrew.name.at(-1) ?? "C"}</div>
            <div>
              <strong>{selectedCrew.name}</strong>
              <span>{selectedCrew.role} · TRAINING PROFILE</span>
            </div>
            <div className="caption-blood">
              <span>CREW ID</span>
              <strong>{selectedCrew.id}</strong>
            </div>
          </div>
          <div className="crew-caption">
            <div>
              <strong>DATABASE ASTRONAUTS</strong>

              {loadingAstronaut && <p>Loading astronauts...</p>}

              {astronautError && <p>{astronautError}</p>}

              {!loadingAstronaut &&
                !astronautError &&
                astronaut.map((item) => (
                  <div key={item.id}>
                    <p>Name: {item.name}</p>
                    <p>Age: {item.age}</p>
                    <p>Mission: {item.missionName}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>
        <aside className="mission-right">
          <EnvironmentStrip vitals={vitals} anomalyActive={anomalyActive} />
          <TriagePanel
            anomalyActive={anomalyActive}
            activeSubsystem={activeSubsystem}
            selectedCrew={selectedCrew}
            onSelectProtocol={setActiveSubsystem}
            onSelectCrew={selectCrew}
            onOpenPvt={() => setPvtOpen(true)}
            pvtScore={lastPvtScore}
            dsnBatchCount={dsnBatchCount}
            onClearDsn={() => setDsnBatchCount(0)}
          />
        </aside>
      </div>
      <footer className="mission-footer">
        <span>
          <span className="footer-indicator" />
          LOCAL TELEMETRY LOOP · 600 MS SAMPLE INTERVAL
        </span>
        <span>TRAINING DATA · NO EXTERNAL CONNECTION</span>
        <span>MISSION ELAPSED TIME · {formatMissionTime(metSeconds)}</span>
      </footer>
      {pvtOpen && (
        <ReflexTest
          onClose={() => setPvtOpen(false)}
          onSaveScore={setLastPvtScore}
        />
      )}
    </main>
  );
}
