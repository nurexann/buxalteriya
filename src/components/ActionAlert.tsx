"use client";

import type { ActionState } from "@/lib/errors";

export function ActionAlert({ state }: { state: ActionState }) {
  if (state.error) {
    return <div className="action-alert error">{state.error}</div>;
  }

  if (state.ok && state.message) {
    return <div className="action-alert ok">{state.message}</div>;
  }

  return null;
}
