"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PrettifyJobStatus } from "@/src/domain/wardrobe";
import { fetchWithAccountSession } from "@/src/features/account/accountApiClient";
import { AppShell } from "@/src/features/wardrobe/components/AppShell";
import { getPrettifyJobSteps, getPrettifyStepCaption } from "@/src/features/wardrobe/real/prettifyJobStatus";
import type { PrettifyJobRecord } from "@/src/features/wardrobe/real/realWardrobePipeline";

interface JobPayload {
  job?: PrettifyJobRecord;
  error?: string;
}

const activitySnippets = [
  "Checking edges",
  "Lifting background",
  "Color preserved",
  "Preparing review",
];

export default function ProcessingPage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId");
  const jobId = params.jobId;
  const didStartRun = useRef(false);
  const didNavigateToReview = useRef(false);
  const [status, setStatus] = useState<PrettifyJobStatus>("queued");
  const [jobKind, setJobKind] = useState<PrettifyJobRecord["jobKind"]>("single_item");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    const response = await fetchWithAccountSession(`/api/wardrobe/jobs/${jobId}`);
    const payload = (await response.json()) as JobPayload;

    if (!response.ok || !payload.job) {
      throw new Error(payload.error ?? "Could not load processing status.");
    }

    setStatus(payload.job.status);
    setJobKind(payload.job.jobKind);
    setError(payload.job.errorMessage);
    return payload.job;
  }, [jobId]);

  const runJob = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetchWithAccountSession(`/api/wardrobe/jobs/${jobId}/run`, { method: "POST" });
      const payload = (await response.json()) as JobPayload;

      if (!response.ok || !payload.job) {
        throw new Error(payload.error ?? "Could not process this upload.");
      }

      setStatus(payload.job.status);
      setJobKind(payload.job.jobKind);
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

  useEffect(() => {
    if (status !== "ready" || !batchId || didNavigateToReview.current) {
      return;
    }

    didNavigateToReview.current = true;
    const timeoutId = window.setTimeout(() => {
      router.push(`/review/${batchId}?jobId=${jobId}`);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [batchId, jobId, router, status]);

  const steps = getPrettifyJobSteps(status, jobKind);
  const activeStep = steps.find((step) => step.state === "active") ?? steps[steps.length - 1];
  const isReady = status === "ready";
  const isFailed = status === "failed";
  const isOutfitJob = jobKind === "outfit_parent";
  const stageState = isFailed ? "failed" : isReady ? "ready" : "running";

  return (
    <AppShell>
      <div className="appbar processing-appbar">
        <div>
          <h1 className="app-title">
            {isReady ? "Ready for review" : isFailed ? "Needs another try" : "Making wardrobe magic"}
          </h1>
          <p className="subtle">
            {isReady
              ? isOutfitJob
                ? "Your outfit items are ready. Moving you to review."
                : "Your item is ready. Moving you to review."
              : isFailed
                ? "This upload needs another try."
                : isOutfitJob
                  ? "Finding visible pieces and turning them into wardrobe-ready items."
                  : "Cleaning the upload into a wardrobe-ready item."}
          </p>
        </div>
      </div>

      <section className={`processing-stage processing-stage-${stageState}`} aria-live="polite">
        <div className="processing-orbit" aria-hidden="true">
          <span className="processing-garment processing-garment-top" />
          <span className="processing-garment processing-garment-bottom" />
          <span className="processing-garment processing-garment-shoe" />
        </div>
        <div className="processing-scan" aria-hidden="true" />
        <div className="processing-spark processing-spark-one" aria-hidden="true" />
        <div className="processing-spark processing-spark-two" aria-hidden="true" />
        <div className="processing-spark processing-spark-three" aria-hidden="true" />

        <div className="processing-core">
          <span className="processing-core-kicker">{isFailed ? "Paused" : isReady ? "Done" : "Working"}</span>
          <strong>{getPrettifyStepCaption(activeStep.id, activeStep.state, jobKind)}</strong>
          <span>{isFailed ? "The atelier paused before finishing." : isReady ? "Opening review now." : activeStep.label}</span>
        </div>

        <div className="processing-activity-cloud" aria-hidden={isFailed}>
          {activitySnippets.map((snippet, index) => (
            <span key={snippet} className={`processing-activity processing-activity-${index + 1}`}>
              {snippet}
            </span>
          ))}
        </div>
      </section>

      <section className={`processing-timeline processing-timeline-${status}`} aria-label="Processing progress">
        {steps.map((step) => (
          <div key={step.id} className={`processing-timeline-step processing-timeline-step-${step.state}`}>
            <span aria-hidden="true" />
            <strong>{step.label}</strong>
          </div>
        ))}
      </section>

      {error ? (
        <p className="processing-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="bottom-actions">
        {isFailed ? (
          <button type="button" className="full-button" onClick={runJob} disabled={isRunning}>
            Retry
          </button>
        ) : (
          <div className="processing-footer-status">{isReady ? "Opening review now" : "Auto-opens review when ready"}</div>
        )}
        <Link className="button secondary" href="/upload">
          Back to upload
        </Link>
      </div>
    </AppShell>
  );
}
