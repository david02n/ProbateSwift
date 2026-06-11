import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  Contact,
  FileCheck,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  PenLine,
  Trophy,
  Upload,
  User,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { peekBrowserSessionId } from "@/lib/browserSession";
import { ProbateCase } from "@shared/schema";
import { EvaluationFlow } from "@/components/evaluation/EvaluationFlow";
import { MilestoneProgress } from "@/components/milestones/MilestoneProgress";

// ── Shared style tokens (cream / navy design system, matches the auth screen) ──
const cardCls = "rounded-[22px] border border-[#E3D9C9] bg-white p-7 sm:p-[38px]";
const cardTitleCls = "m-0 text-[22px] font-extrabold tracking-[-0.015em] sm:text-[26px]";
const cardSubCls = "m-0 mt-1 text-[15px] text-[#8A8278]";
const navyPillCls =
  "inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-[#082D48] px-7 py-[15px] text-[16px] font-bold text-[#F6F0E7] transition hover:bg-[#06223A]";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "evaluation", label: "Evaluation" },
  { id: "documents", label: "Documents" },
  { id: "tasks", label: "Tasks" },
  { id: "chat", label: "Help & Chat" },
  { id: "profile", label: "Profile" },
] as const;

// Centered empty-state pattern: cream icon badge + title + body + optional CTA.
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}> = ({ icon, title, body, children }) => (
  <div className="flex flex-col items-center py-10 text-center">
    <div className="mb-[22px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#EFE7DA]">
      {icon}
    </div>
    <div className="text-[22px] font-extrabold">{title}</div>
    <p className="mx-auto mb-0 mt-2.5 max-w-[440px] text-[16px] leading-[1.5] text-[#5C6670]">
      {body}
    </p>
    {children ? <div className="mt-[26px]">{children}</div> : null}
  </div>
);

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type ChatMessage = { isBot: boolean; text: string; time: string };

const DashboardPage: React.FC = () => {
  const { user, logoutMutation } = useAuth();
  const firstName = (user as any)?.firstName || "User";

  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch probate cases
  const {
    data: probateCases = [],
    isLoading: isLoadingCases,
  } = useQuery<ProbateCase[]>({
    queryKey: ["/api/probate-cases"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const currentCase = probateCases[0] ?? null;

  // On first authenticated visit, bootstrap a draft case and claim the
  // anonymous landing-assessment intake onto it (PS-1 claim-once flow). The
  // ref guards against a double-create before the cases query refetches.
  const queryClient = useQueryClient();
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (isLoadingCases || probateCases.length > 0 || bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    (async () => {
      const res = await apiRequest("POST", "/api/probate-cases", { status: "draft" });
      const created = await res.json();
      await apiRequest("POST", "/api/intake/claim", {
        caseId: created.id,
        browserSessionId: peekBrowserSessionId(),
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/probate-cases"] });
    })().catch(() => {
      bootstrappedRef.current = false; // allow a retry on next render if it failed
    });
  }, [isLoadingCases, probateCases.length, queryClient]);

  // Fetch milestone progress — re-runs whenever evaluation is saved
  const {
    data: progress,
    refetch: refetchProgress,
  } = useQuery<{
    completedSections: string[];
    counts: { people: number; assets: number; liabilities: number; documents: number };
    evaluationStarted: boolean;
    evaluationFlags: Record<string, any> | null;
  }>({
    queryKey: ["/api/probate-cases", currentCase?.id, "progress"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!currentCase,
  });

  const completedSections = progress?.completedSections ?? [];
  // The case's intake-derived flags (replaces the former /api/assessment record).
  const flags = progress?.evaluationFlags ?? null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // ── Help & Chat: working thread (appends a canned support reply) ──
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      isBot: true,
      text: "Welcome to ProbateSwift! How can I assist you with your probate application today?",
      time: "22:08",
    },
    {
      isBot: false,
      text: "I need help understanding what documents I need for probate.",
      time: "22:08",
    },
    {
      isBot: true,
      text: "For probate applications in England and Wales, you'll typically need:\n\n1. Death certificate\n2. The original will (if one exists)\n3. Completed probate application form\n4. Property and asset valuations\n5. Details of any debts",
      time: "22:08",
    },
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, activeTab]);

  const sendChat = () => {
    const t = chatInput.trim();
    if (!t) return;
    const reply = `Thanks, ${firstName}. I've noted that. A probate advisor will follow up, and in the meantime you can start the free assessment from the Overview tab to get a tailored answer.`;
    setMessages((m) => [
      ...m,
      { isBot: false, text: t, time: nowTime() },
      { isBot: true, text: reply, time: nowTime() },
    ]);
    setChatInput("");
  };

  const docCategories = [
    { icon: <Contact className="h-[19px] w-[19px]" />, title: "Identification", sub: "ID, passport, etc." },
    { icon: <FileCheck className="h-[19px] w-[19px]" />, title: "Death Certificate", sub: "Official certificate" },
    { icon: <PenLine className="h-[19px] w-[19px]" />, title: "Will & Codicils", sub: "Original will" },
    { icon: <Home className="h-[19px] w-[19px]" />, title: "Property Valuations", sub: "Home, land, etc." },
  ];

  const resources = [
    { title: "Probate Glossary", desc: "Key terms explained in simple language.", cta: "View Guide" },
    { title: "Document Checklist", desc: "Complete list of required paperwork.", cta: "Download PDF" },
    { title: "Probate Timeline", desc: "Understand each step of the process.", cta: "View Guide" },
  ];

  return (
    <div className="font-hanken min-h-screen bg-[#F6F0E7] text-[#1E2A33] antialiased">
      <div className="mx-auto max-w-[1160px] px-6 pb-[72px] pt-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src="/assets/swift_navy.png" alt="" className="block h-11 w-11" />
            <div>
              <h1 className="m-0 text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                Welcome, {firstName}
              </h1>
              <p className="m-0 mt-1 text-[16px] text-[#5C6670]">
                Continue your probate journey with ProbateSwift
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#E3D9C9] bg-white px-5 py-[11px] text-[15px] font-semibold text-[#1E2A33] transition hover:border-[#C9BBA4] hover:bg-[#FBF7EF]"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Tab bar */}
        <div className="mb-7 mt-[30px] flex flex-wrap items-center gap-1.5 border-b border-[#E3D9C9]">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`-mb-px cursor-pointer border-none bg-transparent px-4 pb-3.5 pt-3 text-[16px] font-semibold transition hover:text-[#082D48] ${
                  active ? "text-[#082D48]" : "text-[#8A8278]"
                }`}
                style={{ borderBottom: `2.5px solid ${active ? "#082D48" : "transparent"}` }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Panels */}
        <div key={activeTab} className="animate-ps-fade">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
              {/* Assessment Status */}
              <div className={cardCls}>
                <h2 className={cardTitleCls}>Assessment Status</h2>
                <p className={cardSubCls}>Your probate assessment information</p>
                {flags ? (
                  <div className="mt-7">
                    <div className="rounded-[16px] border border-[#EFE7DA] bg-[#FBF7EF] p-5">
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E4EAF0] text-[#082D48]">
                          <FileText className="h-4 w-4" />
                        </div>
                        <h3 className="m-0 text-[18px] font-bold">Your Probate Path</h3>
                      </div>
                      <p className="mb-2 ml-12 text-[15px] leading-[1.5] text-[#5C6670]">
                        {flags.probate_type === "grant_of_probate"
                          ? "You will need to apply for a Grant of Probate"
                          : "You will need to apply for Letters of Administration"}
                      </p>
                      <div className="ml-12 flex flex-wrap gap-2">
                        {flags.has_will && (
                          <span className="rounded-[7px] bg-[#E4EAF0] px-2.5 py-1 text-[12px] font-semibold text-[#082D48]">
                            Will Exists
                          </span>
                        )}
                        {flags.needs_specialist_advice && (
                          <span className="rounded-[7px] bg-[#F2E2D8] px-2.5 py-1 text-[12px] font-semibold text-[#B5613C]">
                            Specialist Advice Suggested
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("tasks")}
                      className={`${navyPillCls} mt-5 w-full`}
                    >
                      View Probate Tasks <ArrowRight className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                ) : (
                  <EmptyState
                    icon={<HelpCircle className="h-[34px] w-[34px] text-[#082D48]" strokeWidth={2} />}
                    title="No Assessment Found"
                    body="Complete our assessment to determine if probate is required for your situation."
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTab("evaluation")}
                      className={navyPillCls}
                    >
                      Start Assessment <span className="text-[17px]">→</span>
                    </button>
                  </EmptyState>
                )}
              </div>

              {/* Your Profile */}
              <div className={cardCls}>
                <h2 className={cardTitleCls}>Your Profile</h2>
                <p className={cardSubCls}>Account information</p>
                <div className="mt-6 flex items-center gap-4 border-b border-[#EFE7DA] pb-6">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#E4EAF0] text-[#082D48]">
                    <User className="h-[26px] w-[26px]" />
                  </div>
                  <div>
                    <div className="text-[19px] font-bold">
                      {(user as any)?.firstName && (user as any)?.lastName
                        ? `${(user as any).firstName} ${(user as any).lastName}`
                        : "User Profile"}
                    </div>
                    <div className="text-[15px] text-[#5C6670]">{(user as any)?.email}</div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#EFE7DA] py-[18px]">
                    <span className="text-[15px] font-medium text-[#5C6670]">Email</span>
                    <span className="text-[15px] font-bold">{(user as any)?.email}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#EFE7DA] py-[18px]">
                    <span className="text-[15px] font-medium text-[#5C6670]">Account Created</span>
                    <span className="text-[15px] font-bold text-[#8A8278]">
                      {(user as any)?.createdAt
                        ? new Date((user as any).createdAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-[18px]">
                    <span className="text-[15px] font-medium text-[#5C6670]">Last Login</span>
                    <span className="text-[15px] font-bold text-[#8A8278]">
                      {(user as any)?.lastLogin
                        ? new Date((user as any).lastLogin).toLocaleDateString()
                        : "Just now"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EVALUATION */}
          {activeTab === "evaluation" &&
            (currentCase ? (
              <EvaluationFlow
                caseId={currentCase.id}
                onComplete={() => {
                  refetchProgress();
                }}
              />
            ) : (
              <div className={cardCls}>
                <h2 className={cardTitleCls}>Detailed Probate Evaluation</h2>
                <p className={cardSubCls}>
                  Complete your detailed probate assessment to determine requirements
                </p>
                <EmptyState
                  icon={<FileText className="h-8 w-8 text-[#082D48]" strokeWidth={2} />}
                  title="Create a Probate Case First"
                  body="You need to create a probate case before starting the detailed evaluation."
                >
                  <button type="button" onClick={() => setActiveTab("overview")} className={navyPillCls}>
                    Go to Overview
                  </button>
                </EmptyState>
              </div>
            ))}

          {/* DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
              <div className={cardCls}>
                <h2 className={cardTitleCls}>Upload Documents</h2>
                <p className={cardSubCls}>Add important files related to your probate application</p>

                <div className="mt-6 flex flex-col items-center rounded-[18px] border-2 border-dashed border-[#D8CDBA] bg-[#FBF7EF] p-10 text-center">
                  <div className="mb-[18px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#E4EAF0] text-[#082D48]">
                    <Upload className="h-[26px] w-[26px]" />
                  </div>
                  <div className="text-[19px] font-bold">Drag &amp; Drop Files</div>
                  <p className="mb-5 mt-1.5 text-[15px] text-[#5C6670]">
                    Upload PDFs, images, or document files (max 10MB)
                  </p>
                  <input type="file" className="hidden" id="document-upload" multiple />
                  <button
                    type="button"
                    onClick={() => document.getElementById("document-upload")?.click()}
                    className={navyPillCls}
                  >
                    Browse Files
                  </button>
                </div>

                <h3 className="mb-4 mt-[30px] text-[18px] font-extrabold">Document Categories</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {docCategories.map((cat) => (
                    <div key={cat.title} className="rounded-[16px] border border-[#E3D9C9] p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] bg-[#E4EAF0] text-[#082D48]">
                          {cat.icon}
                        </div>
                        <div>
                          <div className="text-[16px] font-bold">{cat.title}</div>
                          <div className="text-[13px] text-[#8A8278]">{cat.sub}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById("document-upload")?.click()}
                        className="w-full cursor-pointer rounded-[10px] border border-[#E3D9C9] bg-[#FBF7EF] py-2.5 text-[14px] font-semibold text-[#082D48] transition hover:bg-[#E4EAF0]"
                      >
                        Upload
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cardCls}>
                <h2 className={cardTitleCls}>Your Documents</h2>
                <p className={cardSubCls}>Recently uploaded files</p>
                <EmptyState
                  icon={<FileText className="h-7 w-7 text-[#082D48]" strokeWidth={2} />}
                  title="No Documents Yet"
                  body="Documents you upload will appear here."
                />
              </div>
            </div>
          )}

          {/* TASKS */}
          {activeTab === "tasks" &&
            (isLoadingCases ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#082D48]" />
              </div>
            ) : currentCase ? (
              <MilestoneProgress
                completedSections={completedSections}
                evaluationFlags={progress?.evaluationFlags}
                onStartEvaluation={() => setActiveTab("evaluation")}
                onNavigateToTab={setActiveTab}
              />
            ) : (
              <div className={cardCls}>
                <EmptyState
                  icon={<Trophy className="h-8 w-8 text-[#B5613C]" strokeWidth={2} />}
                  title="No Active Case Yet"
                  body="Your progress milestones will appear here once a probate case is created."
                >
                  <button type="button" onClick={() => setActiveTab("evaluation")} className={navyPillCls}>
                    Start Evaluation <ArrowRight className="h-[18px] w-[18px]" />
                  </button>
                </EmptyState>
              </div>
            ))}

          {/* HELP & CHAT */}
          {activeTab === "chat" && (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
              <div className="flex flex-col rounded-[22px] border border-[#E3D9C9] bg-white p-7 sm:p-8">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-[22px] w-[22px] text-[#082D48]" />
                  <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.015em]">Chat Support</h2>
                </div>
                <p className="m-0 mb-[22px] mt-1.5 text-[15px] text-[#8A8278]">
                  Speak with our probate advisors
                </p>

                <div
                  ref={chatScrollRef}
                  className="ps-scroll flex h-[360px] flex-col gap-[18px] overflow-y-auto pr-2"
                >
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 ${m.isBot ? "" : "flex-row-reverse"}`}
                    >
                      {m.isBot && (
                        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-[#082D48]">
                          <MessageSquare className="h-4 w-4 text-[#F6F0E7]" />
                        </div>
                      )}
                      <div
                        className="max-w-[78%] rounded-[14px] border px-4 py-3.5"
                        style={{
                          background: m.isBot ? "#FBF7EF" : "#E4EAF0",
                          borderColor: m.isBot ? "#EFE7DA" : "#D4DEEA",
                        }}
                      >
                        {m.isBot && (
                          <div className="mb-1.5 text-[13px] font-bold text-[#082D48]">
                            ProbateSwift Support
                          </div>
                        )}
                        <div className="whitespace-pre-line text-[15px] leading-[1.5] text-[#1E2A33]">
                          {m.text}
                        </div>
                        <div className="mt-[7px] text-[12px] text-[#8A8278]">{m.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex gap-3">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    placeholder="Type your message here..."
                    className="flex-1 rounded-[12px] border-[1.5px] border-[#E3D9C9] bg-[#FBF7EF] px-4 py-3.5 text-[15px] font-medium text-[#1E2A33] outline-none focus:border-[#082D48]"
                  />
                  <button
                    type="button"
                    onClick={sendChat}
                    className="cursor-pointer rounded-[12px] border-none bg-[#082D48] px-[26px] text-[15px] font-bold text-[#F6F0E7] transition hover:bg-[#06223A]"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div className="rounded-[22px] border border-[#E3D9C9] bg-white p-7 sm:p-8">
                <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.015em]">Help Resources</h2>
                <p className="m-0 mb-[22px] mt-1 text-[15px] text-[#8A8278]">Useful guides and FAQs</p>
                <div className="flex flex-col gap-[18px]">
                  {resources.map((res) => (
                    <div key={res.title} className="border-b border-[#EFE7DA] pb-[18px]">
                      <div className="mb-1.5 flex items-center gap-2.5">
                        <FileText className="h-[17px] w-[17px] text-[#082D48]" />
                        <span className="text-[17px] font-bold">{res.title}</span>
                      </div>
                      <p className="m-0 mb-1.5 text-[14px] text-[#5C6670]">{res.desc}</p>
                      <button
                        type="button"
                        className="cursor-pointer border-none bg-transparent p-0 text-[14px] font-bold text-[#082D48] underline"
                      >
                        {res.cta}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-[12px] border border-[#E3D9C9] bg-[#FBF7EF] py-3 text-[15px] font-semibold text-[#082D48] transition hover:bg-[#E4EAF0]"
                  >
                    View All Resources
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div className={cardCls}>
              <h2 className={cardTitleCls}>Profile Settings</h2>
              <p className={cardSubCls}>Manage your account details</p>
              <EmptyState
                icon={<User className="h-8 w-8 text-[#082D48]" strokeWidth={2} />}
                title="Profile Settings"
                body="Profile settings will be available soon."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
