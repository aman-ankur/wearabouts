"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PrettifyJobStatus } from "@/src/domain/wardrobe";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { getPrettifyJobSteps } from "@/src/features/wardrobe/real/prettifyJobStatus";
import type { PrettifyJobRecord } from "@/src/features/wardrobe/real/realWardrobePipeline";

interface JobPayload {
  job?: PrettifyJobRecord;
  error?: string;
}

const stepColor: Record<string, string> = {
  complete: "var(--ink)",
  active: "var(--blue)",
  pending: "var(--muted)",
  failed: "var(--wine)",
};

export default function ProcessingPage() {
  const params = useParams<{ jobId: string }>();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId");
  const jobId = params.jobId;
  const didStartRun = useRef(false);
  const [status, setStatus] = useState<PrettifyJobStatus>("queued");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    const response = await fetch(`/api/wardrobe/jobs/${jobId}`);
    const payload = (await response.json()) as JobPayload;

    if (!response.ok || !payload.job) {
      throw new Error(payload.error ?? "Could not load processing status.");
    }

    setStatus(payload.job.status);
    setError(payload.job.errorMessage);
    return payload.job;
  }, [jobId]);

  const runJob = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch(`/api/wardrobe/jobs/${jobId}/run`, { method: "POST" });
      const payload = (await response.json()) as JobPayload;

      if (!response.ok || !payload.job) {
        throw new Error(payload.error ?? "Could not process this upload.");
      }

      setStatus(payload.job.status);
      setError(payload.job.errorMessage);
    } catch (caughtError) {
      setStatus("failed");
      setError(caughtError instanceof Error ? caughtError.message : "Could not process this upload.");
    } finally {
      setIsRunning(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (didStartRun.current) {
      return;
    }

    didStartRun.current = true;
    void loadJob().finally(() => {
      void runJob();
    });
  }, [loadJob, runJob]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadJob().catch(() => undefined);
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [isRunning, loadJob]);

  const steps = getPrettifyJobSteps(status);
  const isReady = status === "ready";
  const isFailed = status === "failed";

  return (
    <AppShell>
      <div className="appbar">
        <div>
          <h1 className="app-title">Prettifying</h1>
          <p className="subtle">
            {isReady
              ? "Your item is ready for review."
              : isFailed
                ? "This upload needs another try."
                : "Keeping the upload moving while the asset is prepared."}
          </p>
        </div>
      </div>

      <section className="card" style={{ display: "grid", gap: 14 }}>
        {steps.map((step) => (
          <div
            key={step.id}
            style={{
              display: "grid",
              gridTemplateColumns: "24px minmax(0, 1fr)",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                background: step.state === "active" ? "var(--blue)" : "var(--soft)",
                color: step.state === "active" ? "var(--white)" : stepColor[step.state],
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {step.state === "complete" ? "ok" : step.state === "failed" ? "!" : "."}
            </span>
            <div>
              <strong style={{ color: stepColor[step.state] }}>{step.label}</strong>
              <p className="subtle" style={{ margin: "2px 0 0" }}>
                {step.state === "active" ? "In progress" : step.state}
              </p>
            </div>
          </div>
        ))}
      </section>

      {error ? (
        <p className="subtle" role="alert" style={{ color: "var(--wine)" }}>
          {error}
        </p>
      ) : null}

      <div className="bottom-actions">
        {isReady && batchId ? (
          <Link className="full-button" href={`/review/${batchId}`} style={{ display: "grid", placeItems: "center" }}>
            Review item
          </Link>
        ) : (
          <button type="button" className="full-button" onClick={runJob} disabled={!isFailed && isRunning}>
            {isFailed ? "Retry" : "Processing..."}
          </button>
        )}
        <Link className="button secondary" href="/upload">
          Back to upload
        </Link>
      </div>
    </AppShell>
  );
}
