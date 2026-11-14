import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Orbit, UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { astronautProfileSchema, type AstronautProfile, type AstronautProfileInput } from "@/lib/astronaut-profile";

const initialValues: AstronautProfileInput = { astronautId: "", name: "", age: "", mission: "" };

export function AstronautEntryPage() {
  const [values, setValues] = useState<AstronautProfileInput>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof AstronautProfileInput, string>>>({});
  const [capturedProfile, setCapturedProfile] = useState<AstronautProfile | null>(null);

  const updateField = (field: keyof AstronautProfileInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setCapturedProfile(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = astronautProfileSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof AstronautProfileInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && field in values && !fieldErrors[field as keyof AstronautProfileInput]) {
          fieldErrors[field as keyof AstronautProfileInput] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setCapturedProfile(null);
      return;
    }
    setErrors({});
    setCapturedProfile(result.data);
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setCapturedProfile(null);
  };

  return (
    <main className="astronaut-entry-page">
      <header className="astronaut-entry-header">
        <Link to="/" className="entry-brand">
          <span className="entry-brand-mark"><Orbit size={18} /></span>
          <span><strong>FLIGHT MEDICINE</strong><small>TRAINING CONSOLE</small></span>
        </Link>
        <Button variant="outline" className="entry-back-button" asChild>
          <Link to="/"><ArrowLeft size={15} /> Mission dashboard</Link>
        </Button>
      </header>

      <div className="entry-content">
        <div className="entry-heading">
          <span className="entry-kicker"><span className="entry-status-dot" /> CREW RECORD / NEW ENTRY</span>
          <h1>Astronaut profile</h1>
          <p>Enter crew details for a mission training profile.</p>
          <div className="entry-demo-note">DEMO ENTRY <span>·</span> Profiles are not stored or transmitted.</div>
        </div>

        <form className="astronaut-form" onSubmit={handleSubmit} noValidate>
          <div className="form-section-heading"><span>01</span><h2>Identity & assignment</h2></div>
          <div className="astronaut-form-grid">
            <div className="astronaut-field">
              <label htmlFor="astronaut-id">Astronaut ID</label>
              <input id="astronaut-id" name="astronautId" autoComplete="off" placeholder="e.g. AST-05-LEE" maxLength={32} value={values.astronautId} onChange={(event) => updateField("astronautId", event.target.value)} aria-invalid={Boolean(errors.astronautId)} aria-describedby={errors.astronautId ? "astronaut-id-error" : undefined} />
              {errors.astronautId && <span className="field-error" id="astronaut-id-error" role="alert">{errors.astronautId}</span>}
            </div>
            <div className="astronaut-field">
              <label htmlFor="astronaut-age">Age</label>
              <input id="astronaut-age" name="age" type="number" inputMode="numeric" min="1" max="120" step="1" placeholder="Years" value={values.age} onChange={(event) => updateField("age", event.target.value)} aria-invalid={Boolean(errors.age)} aria-describedby={errors.age ? "astronaut-age-error" : undefined} />
              {errors.age && <span className="field-error" id="astronaut-age-error" role="alert">{errors.age}</span>}
            </div>
            <div className="astronaut-field astronaut-field-wide">
              <label htmlFor="astronaut-name">Full name</label>
              <input id="astronaut-name" name="name" autoComplete="name" maxLength={100} placeholder="Enter full name" value={values.name} onChange={(event) => updateField("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "astronaut-name-error" : undefined} />
              {errors.name && <span className="field-error" id="astronaut-name-error" role="alert">{errors.name}</span>}
            </div>
            <div className="astronaut-field astronaut-field-wide">
              <label htmlFor="astronaut-mission">Mission</label>
              <input id="astronaut-mission" name="mission" maxLength={120} placeholder="e.g. Artemis IV" value={values.mission} onChange={(event) => updateField("mission", event.target.value)} aria-invalid={Boolean(errors.mission)} aria-describedby={errors.mission ? "astronaut-mission-error" : undefined} />
              {errors.mission && <span className="field-error" id="astronaut-mission-error" role="alert">{errors.mission}</span>}
            </div>
          </div>

          <div className="entry-form-actions">
            <Button type="submit" className="entry-submit-button"><UserRoundPlus size={15} /> Capture profile</Button>
            <span>All fields required</span>
          </div>
        </form>

        {capturedProfile && (
          <section className="profile-captured" aria-live="polite">
            <div className="captured-icon"><Check size={17} /></div>
            <div className="captured-copy">
              <strong>Profile details captured</strong>
              <span>{capturedProfile.name} · {capturedProfile.astronautId} · Age {capturedProfile.age} · {capturedProfile.mission}</span>
            </div>
            <Button variant="outline" className="entry-reset-button" onClick={resetForm}>Add another</Button>
          </section>
        )}
      </div>
    </main>
  );
}