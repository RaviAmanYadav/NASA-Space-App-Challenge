import { describe, expect, it } from "vitest";

import { crewRoster, formatMissionTime, getProtocolKey, initialVitals, nextSimulatedVitals, protocols } from "@/lib/mission-data";

describe("mission simulation data", () => {
  it("formats elapsed mission time as days and a clock", () => {
    expect(formatMissionTime(12334184)).toBe("142d 18:09:44");
  });

  it("starts new crews on their own physiological demonstration baseline", () => {
    for (const crew of crewRoster) {
      const vitals = initialVitals(crew);
      expect(vitals.hr).toBe(crew.baseHr);
      expect(vitals.icp).toBe(crew.baseIcp);
    }
  });

  it("uses the selected anomaly protocol and returns to nominal after clearing", () => {
    expect(getProtocolKey(null, true)).toBe("THORAX_CARDIO");
    expect(getProtocolKey(null, false)).toBe("NOMINAL");
    const emergencyProtocol = protocols[getProtocolKey(null, true)];
    expect(emergencyProtocol?.severity).toBe("CRITICAL");
  });

  it("keeps simulated nominal and anomaly readings on their scenario ranges", () => {
    const crew = crewRoster.find((member) => member.id === "AST-04-VANCE");
    if (!crew) throw new Error("The demonstration roster must include its commander.");
    for (let sample = 0; sample < 40; sample += 1) {
      const nominal = nextSimulatedVitals(crew, false);
      expect(nominal.hr).toBeGreaterThanOrEqual(crew.baseHr - 2);
      expect(nominal.hr).toBeLessThanOrEqual(crew.baseHr + 2);
      expect(nominal.spo2).toBeGreaterThanOrEqual(98.0);
      expect(nominal.spo2).toBeLessThanOrEqual(98.6);
      const alert = nextSimulatedVitals(crew, true);
      expect(alert.hr).toBeGreaterThanOrEqual(130);
      expect(alert.hr).toBeLessThanOrEqual(138);
      expect(alert.spo2).toBeGreaterThanOrEqual(89.8);
      expect(alert.spo2).toBeLessThanOrEqual(91.0);
      expect(alert.co2).toBeGreaterThanOrEqual(4.1);
      expect(alert.co2).toBeLessThanOrEqual(4.3);
    }
  });
});
