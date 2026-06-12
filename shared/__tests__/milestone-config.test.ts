import { describe, it, expect } from "vitest";
import { computeGuidedView, PHASES, type TaskState } from "../milestone-config";

// Minimal flag sets mirroring what deriveFlags() produces for the two main paths.
const IHT400_FLAGS = {
  probate_type: "grant_of_probate",
  has_will: true,
  iht400_required: true,
};

const EXCEPTED_FLAGS = {
  probate_type: "grant_of_probate",
  has_will: true,
  estate_likely_excepted: true,
};

describe("computeGuidedView", () => {
  it("exposes all seven lifecycle phases", () => {
    const view = computeGuidedView(IHT400_FLAGS, {});
    expect(view.phases).toHaveLength(7);
    expect(view.phases.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("starts a fresh case in phase 2 (value the estate) with a single next step", () => {
    const view = computeGuidedView(IHT400_FLAGS, {});
    expect(view.currentPhase).toBe(2);
    expect(view.nextStep).not.toBeNull();
    expect(view.nextStep!.phase).toBe(2);
    expect(view.nextStep!.status).toBe("your_move");
  });

  it("includes IHT phases (3 and 4) for an estate that needs IHT400", () => {
    const view = computeGuidedView(IHT400_FLAGS, {});
    const phase3 = view.phases.find((p) => p.number === 3)!;
    const phase4 = view.phases.find((p) => p.number === 4)!;
    expect(phase3.total).toBeGreaterThan(0);
    expect(phase4.total).toBeGreaterThan(0);
  });

  it("collapses the IHT-payment phase for an excepted estate", () => {
    const view = computeGuidedView(EXCEPTED_FLAGS, {});
    const phase4 = view.phases.find((p) => p.number === 4)!;
    expect(phase4.total).toBe(0); // no IHT to pay → phase auto-clears
  });

  it("advances to the next phase once the current phase's tasks are done", () => {
    const fresh = computeGuidedView(IHT400_FLAGS, {});
    const phase2Tasks = fresh.currentPhaseTasks;
    expect(phase2Tasks.length).toBeGreaterThan(0);

    const states: Record<string, TaskState> = {};
    for (const t of phase2Tasks) states[t.id] = { status: "done" };

    const after = computeGuidedView(IHT400_FLAGS, states);
    expect(after.currentPhase).toBeGreaterThan(2);
    expect(after.percentComplete).toBeGreaterThan(fresh.percentComplete);
  });

  it("treats a parked 'awaiting' task as not blocking the next step", () => {
    const fresh = computeGuidedView(IHT400_FLAGS, {});
    const first = fresh.currentPhaseTasks[0];
    const view = computeGuidedView(IHT400_FLAGS, {
      [first.id]: { status: "awaiting", awaitingSince: "2026-01-01T00:00:00.000Z" },
    });
    // The awaiting task is no longer the elevated next step.
    expect(view.nextStep?.id).not.toBe(first.id);
  });

  it("returns an empty view when there are no flags yet", () => {
    const view = computeGuidedView(null, {});
    expect(view.currentPhase).toBe(PHASES.length);
    expect(view.nextStep).toBeNull();
  });
});
