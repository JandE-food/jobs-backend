"use client";

import { useState } from "react";

import { adminToken, apiUrl, demoUserId } from "./api";

export function PrivacyActions() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState<"request" | "download" | "delete" | null>(null);

  async function requestDeletion() {
    setBusyAction("request");
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${apiUrl}/privacy/request-deletion`, {
        method: "POST",
        headers: {
          "x-user-id": demoUserId,
        },
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error("Unable to request deletion.");
      }

      setMessage(payload.message ?? "Deletion request created.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to request deletion.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function downloadData() {
    setBusyAction("download");
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${apiUrl}/privacy/export`, {
        headers: {
          "x-user-id": demoUserId,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to export data.");
      }

      const text = await response.text();
      const blob = new Blob([text], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "privacy-export.json";
      anchor.click();
      window.URL.revokeObjectURL(url);
      setMessage("Data export downloaded.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to export data.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function runAdminDeletion() {
    setBusyAction("delete");
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${apiUrl}/admin/privacy/delete/${demoUserId}`, {
        method: "POST",
        headers: {
          "x-admin-token": adminToken,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to run admin deletion.");
      }

      setMessage("Admin deletion completed for the demo user.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to run admin deletion.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="stack-gap">
      <div className="content-card">
        <h2>GDPR controls</h2>
        <p className="muted-copy">
          These controls use demo user `1` by default so you can exercise the
          routes before full authentication is in place.
        </p>
        <div className="button-row">
          <button
            className="primary-button"
            type="button"
            onClick={requestDeletion}
            disabled={busyAction !== null}
          >
            {busyAction === "request" ? "Requesting..." : "Request account deletion"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={downloadData}
            disabled={busyAction !== null}
          >
            {busyAction === "download" ? "Preparing..." : "Download my data"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={runAdminDeletion}
            disabled={busyAction !== null}
          >
            {busyAction === "delete" ? "Deleting..." : "Run admin delete"}
          </button>
        </div>
      </div>

      {message ? <p className="success-copy">{message}</p> : null}
      {error ? <p className="error-copy">{error}</p> : null}
    </div>
  );
}
