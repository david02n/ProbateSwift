import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Clock,
  FileText,
  Hourglass,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import {
  computeGuidedView,
  PHASES,
  type GuidedTask,
  type TaskState,
} from "@shared/milestone-config";
import type { CaseTask, EstateAsset, EstateLiability } from "@shared/schema";

interface GuidedTaskListProps {
  caseId: number;
  caseTitle: string;
  evaluationFlags?: Record<string, any> | null;
  onNavigateToTab: (tab: string) => void;
  onStartEvaluation: () => void;
}

// ── style tokens (cream / navy, matching the dashboard) ──
const navyPill =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-[#082D48] px-5 py-2.5 text-[14px] font-bold text-[#F6F0E7] transition hover:bg-[#06223A] disabled:opacity-60";

const pillCls = {
  done: "bg-[#DDEAD9] text-[#3F6B36]",
  awaiting: "bg-[#F2E2D8] text-[#B5613C]",
  your_move: "bg-[#E4EAF0] text-[#082D48]",
} as const;

function daysSince(iso?: string | null): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

const gbp = (v: string | number | null | undefined): string | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  if (isNaN(n)) return null;
  return `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
};

export const GuidedTaskList: React.FC<GuidedTaskListProps> = ({
  caseId,
  caseTitle,
  evaluationFlags,
  onNavigateToTab,
  onStartEvaluation,
}) => {
  const queryClient = useQueryClient();

  const { data: taskRows = [] } = useQuery<CaseTask[]>({
    queryKey: ["/api/probate-cases", caseId, "tasks"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!caseId,
  });

  // Per-asset / per-liability valuation rows live under phase 2.
  const { data: assets = [] } = useQuery<EstateAsset[]>({
    queryKey: ["/api/assets", caseId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!caseId,
  });
  const { data: liabilities = [] } = useQuery<EstateLiability[]>({
    queryKey: ["/api/liabilities", caseId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!caseId,
  });

  const states: Record<string, TaskState> = {};
  for (const r of taskRows) {
    states[r.taskKey] = { status: r.status as TaskState["status"], awaitingSince: r.awaitingSince as any };
  }

  const view = computeGuidedView(evaluationFlags, states);
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const openPhase = selectedPhase ?? view.currentPhase;

  const patchTask = useMutation({
    mutationFn: async (vars: { taskKey: string; status: TaskState["status"] }) => {
      const res = await apiRequest("PATCH", `/api/probate-cases/${caseId}/tasks`, vars);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/probate-cases", caseId, "tasks"] });
    },
  });

  const setStatus = (taskKey: string, status: TaskState["status"]) =>
    patchTask.mutate({ taskKey, status });

  // No evaluation yet → nudge the user to complete it first.
  if (!evaluationFlags) {
    return (
      <div className="rounded-[22px] border border-[#E3D9C9] bg-white p-7 sm:p-8 text-center">
        <div className="mx-auto mb-5 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#EFE7DA]">
          <FileText className="h-7 w-7 text-[#082D48]" />
        </div>
        <h3 className="text-[20px] font-extrabold">Your guided plan is almost ready</h3>
        <p className="mx-auto mt-2 max-w-[440px] text-[15px] text-[#5C6670]">
          Complete the short evaluation and we'll build a step-by-step plan tailored to this estate.
        </p>
        <button type="button" onClick={onStartEvaluation} className={`${navyPill} mt-6`}>
          Start the evaluation <ArrowRight className="h-[16px] w-[16px]" />
        </button>
      </div>
    );
  }

  const phaseMeta = PHASES.find((p) => p.number === openPhase)!;
  const openTasks = view.currentPhaseTasks.length && openPhase === view.currentPhase
    ? view.currentPhaseTasks
    : []; // tasks list is computed for the current phase; other phases show summary

  // Phase-2 valuation rows (assets + liabilities), shown when phase 2 is open.
  const valuationRows =
    openPhase === 2
      ? [
          ...assets.map((a) => ({
            key: `asset:${a.id}`,
            label: a.description || a.institution || "Asset",
            value: gbp(a.value),
            kind: "asset" as const,
          })),
          ...liabilities.map((l) => ({
            key: `liability:${l.id}`,
            label: l.description || l.creditor || "Debt",
            value: gbp(l.amount),
            kind: "liability" as const,
          })),
        ]
      : [];

  const StatusPill: React.FC<{ status: TaskState["status"]; awaitingSince?: string | null; valueLabel?: string | null }> = ({
    status,
    awaitingSince,
    valueLabel,
  }) => {
    if (valueLabel && status !== "awaiting") {
      return <span className={`rounded-[8px] px-2.5 py-1 text-[12px] font-semibold ${pillCls.done}`}>{valueLabel}</span>;
    }
    if (status === "awaiting") {
      return (
        <span className={`rounded-[8px] px-2.5 py-1 text-[12px] font-semibold ${pillCls.awaiting}`}>
          Awaiting reply · {daysSince(awaitingSince)}d
        </span>
      );
    }
    if (status === "done") {
      return <span className={`rounded-[8px] px-2.5 py-1 text-[12px] font-semibold ${pillCls.done}`}>Done</span>;
    }
    return <span className={`rounded-[8px] px-2.5 py-1 text-[12px] font-semibold ${pillCls.your_move}`}>Your move</span>;
  };

  return (
    <div>
      {/* Header + progress */}
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.015em]">{caseTitle}</h2>
        <span className="text-[14px] text-[#5C6670]">
          Phase {view.currentPhase} of {PHASES.length} · about {view.percentComplete}% through
        </span>
      </div>
      <div className="mb-7 h-[7px] overflow-hidden rounded-full bg-[#E9E0D2]">
        <div className="h-full rounded-full bg-[#082D48]" style={{ width: `${view.percentComplete}%` }} />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Phase rail */}
        <div className="flex flex-col gap-1.5 lg:w-[260px] lg:flex-shrink-0">
          {view.phases.map((p) => {
            const isOpen = p.number === openPhase;
            const dot =
              p.state === "done" ? (
                <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#3F6B36] text-white">
                  <Check className="h-[15px] w-[15px]" />
                </span>
              ) : p.state === "now" ? (
                <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#082D48] text-white">
                  <Pencil className="h-[13px] w-[13px]" />
                </span>
              ) : (
                <span className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#EFE7DA] text-[13px] font-bold text-[#8A8278]">
                  {p.number}
                </span>
              );
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPhase(p.number)}
                className={`flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left text-[14px] transition ${
                  isOpen
                    ? "border-[#C9D4E0] bg-[#EAF0F6]"
                    : "border-transparent hover:bg-[#FBF7EF]"
                }`}
              >
                {dot}
                <span className={`flex-1 ${p.state === "upcoming" ? "text-[#5C6670]" : ""} ${p.state === "now" ? "font-bold" : "font-medium"}`}>
                  {p.number} · {p.name}
                </span>
                {p.state === "done" && <span className="text-[12px] text-[#3F6B36]">Done</span>}
                {p.state === "now" && <span className="text-[12px] font-semibold text-[#082D48]">Now</span>}
              </button>
            );
          })}
        </div>

        {/* Open phase detail */}
        <div className="min-w-0 flex-1">
          <div className="rounded-[18px] border border-[#E3D9C9] bg-white p-6">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="m-0 text-[18px] font-extrabold">{phaseMeta.name}</h3>
              {openPhase === view.currentPhase && (
                <span className="text-[13px] text-[#5C6670]">
                  {view.phases.find((p) => p.number === openPhase)?.doneCount} of{" "}
                  {view.phases.find((p) => p.number === openPhase)?.total} done
                </span>
              )}
            </div>
            <p className="mb-4 mt-1 text-[13.5px] text-[#5C6670]">{phaseMeta.description}</p>

            {/* Your next step (only on the current phase) */}
            {openPhase === view.currentPhase && view.nextStep && (
              <div className="mb-4 flex items-center gap-3 rounded-[12px] bg-[#EAF0F6] px-4 py-3">
                <ArrowRight className="h-5 w-5 flex-shrink-0 text-[#082D48]" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-[#082D48]">Your next step</div>
                  <div className="truncate text-[14px] font-bold">{view.nextStep.title}</div>
                </div>
                {view.nextStep.tab ? (
                  <button type="button" onClick={() => onNavigateToTab(view.nextStep!.tab!)} className={navyPill}>
                    Start
                  </button>
                ) : (
                  <button type="button" onClick={() => setStatus(view.nextStep!.id, "done")} className={navyPill}>
                    Mark done
                  </button>
                )}
              </div>
            )}

            {/* Task rows for the open (current) phase */}
            {openTasks.map((t: GuidedTask) => (
              <div key={t.id} className="flex items-center gap-3 border-t border-[#EFE7DA] py-3">
                <button
                  type="button"
                  onClick={() => setStatus(t.id, t.status === "done" ? "your_move" : "done")}
                  aria-label={t.status === "done" ? "Mark not done" : "Mark done"}
                  className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border transition ${
                    t.status === "done"
                      ? "border-[#3F6B36] bg-[#3F6B36] text-white"
                      : "border-[#C9BBA4] hover:border-[#082D48]"
                  }`}
                >
                  {t.status === "done" && <Check className="h-[13px] w-[13px]" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-[14px] font-semibold ${t.status === "done" ? "text-[#8A8278] line-through" : ""}`}>
                    {t.title}
                  </div>
                </div>
                <StatusPill status={t.status} awaitingSince={t.awaitingSince} />
                {t.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => setStatus(t.id, t.status === "awaiting" ? "your_move" : "awaiting")}
                    title={t.status === "awaiting" ? "No longer waiting" : "Mark as awaiting a reply"}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#8A8278] transition hover:bg-[#F2E2D8] hover:text-[#B5613C]"
                  >
                    {t.status === "awaiting" ? <RotateCcw className="h-[15px] w-[15px]" /> : <Clock className="h-[15px] w-[15px]" />}
                  </button>
                )}
                {t.tab && t.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab(t.tab!)}
                    className="text-[13px] font-bold text-[#082D48] underline"
                  >
                    Go
                  </button>
                )}
              </div>
            ))}

            {/* Phase-2 valuation rows (from extracted assets & debts) */}
            {valuationRows.map((row) => {
              const st = (states[row.key]?.status as TaskState["status"]) ?? "your_move";
              return (
                <div key={row.key} className="flex items-center gap-3 border-t border-[#EFE7DA] py-3">
                  <button
                    type="button"
                    onClick={() => setStatus(row.key, st === "done" ? "your_move" : "done")}
                    aria-label="Toggle valued"
                    className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border transition ${
                      st === "done" || row.value
                        ? "border-[#3F6B36] bg-[#3F6B36] text-white"
                        : "border-[#C9BBA4] hover:border-[#082D48]"
                    }`}
                  >
                    {(st === "done" || row.value) && <Check className="h-[13px] w-[13px]" />}
                  </button>
                  <div className="min-w-0 flex-1 text-[14px]">{row.label}</div>
                  <StatusPill status={st} awaitingSince={states[row.key]?.awaitingSince} valueLabel={row.value} />
                  {!row.value && st !== "done" && (
                    <button
                      type="button"
                      onClick={() => setStatus(row.key, st === "awaiting" ? "your_move" : "awaiting")}
                      title={st === "awaiting" ? "No longer waiting" : "Mark as awaiting a reply"}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#8A8278] transition hover:bg-[#F2E2D8] hover:text-[#B5613C]"
                    >
                      {st === "awaiting" ? <RotateCcw className="h-[15px] w-[15px]" /> : <Clock className="h-[15px] w-[15px]" />}
                    </button>
                  )}
                </div>
              );
            })}

            {openPhase === 2 && valuationRows.length === 0 && openTasks.length === 0 && (
              <p className="border-t border-[#EFE7DA] pt-4 text-[13.5px] text-[#5C6670]">
                Upload bank statements and valuations in the Documents tab — we'll pull the figures in here automatically.
              </p>
            )}

            {openPhase !== view.currentPhase && (
              <p className="mt-3 text-[13px] text-[#8A8278]">
                {view.phases.find((p) => p.number === openPhase)?.state === "done"
                  ? "You've completed this phase."
                  : "This phase opens up once you reach it. Here's what's coming."}
              </p>
            )}
          </div>

          {/* While you wait — parallel-prep head start */}
          {openPhase === view.currentPhase && view.parallelPrep.length > 0 && (
            <div className="mt-3.5 rounded-[18px] bg-[#F4EFE6] p-5">
              <div className="flex items-center gap-2 text-[14px] font-bold">
                <Hourglass className="h-[16px] w-[16px] text-[#5C6670]" /> While you wait, get a head start
              </div>
              <p className="mb-3 mt-1 text-[12.5px] text-[#5C6670]">
                These don't depend on anything you're waiting for, so you could already:
              </p>
              <div className="flex flex-wrap gap-2">
                {view.parallelPrep.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => (t.tab ? onNavigateToTab(t.tab) : setStatus(t.id, "done"))}
                    className="cursor-pointer rounded-[9px] border border-[#D8CDBA] bg-white px-3 py-2 text-[13px] font-semibold text-[#082D48] transition hover:bg-[#FBF7EF]"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuidedTaskList;
