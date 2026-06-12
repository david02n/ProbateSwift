import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Contact,
  Download,
  FileCheck,
  FileText,
  HelpCircle,
  Home,
  Loader2,
  LogOut,
  MessageSquare,
  PenLine,
  Trash2,
  Trophy,
  Upload,
  User,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { peekBrowserSessionId } from "@/lib/browserSession";
import { ProbateCase, Document } from "@shared/schema";
import { uploadDocument, deleteDocument } from "@/lib/documentService";
import { useToast } from "@/hooks/use-toast";
import { EvaluationFlow } from "@/components/evaluation/EvaluationFlow";
import { GuidedTaskList } from "@/components/milestones/GuidedTaskList";
import { PaymentCta } from "@/components/payment/PaymentCta";

// Dashboard tabs that a task can deep-link to; anything else (legacy "people"/
// "assets") routes to Documents, where uploads populate those records.
const DASHBOARD_TABS = ["overview", "evaluation", "documents", "tasks", "help", "profile"];

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
  { id: "help", label: "Help" },
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

  const { toast } = useToast();

  // ── Documents: real upload pipeline (S3 → Gemini extraction) ──
  // Poll while anything is still processing so extracted people/assets surface
  // without the user refreshing.
  const {
    data: documents = [],
    refetch: refetchDocuments,
  } = useQuery<Document[]>({
    queryKey: ["/api/documents", currentCase?.id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!currentCase,
    refetchInterval: (query) =>
      (query.state.data as Document[] | undefined)?.some((d) => d.status === "processing")
        ? 4000
        : false,
  });
  const visibleDocuments = documents.filter((d) => d.status !== "deleted");

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const docInputRef = useRef<HTMLInputElement>(null);
  const pendingCategoryRef = useRef<string>("general");

  // Open the hidden file picker, remembering which category was clicked.
  const openDocPicker = (category = "general") => {
    pendingCategoryRef.current = category;
    docInputRef.current?.click();
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (!currentCase) {
      toast({
        title: "Setting up your case…",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    const category = pendingCategoryRef.current || "general";
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        setUploadMsg(`Uploading ${file.name}…`);
        const result = await uploadDocument(file, currentCase.id, category);
        if (!result.success) throw new Error(result.error || "Upload failed");
      }
      toast({
        title: "Upload complete",
        description: "We're reading your document to pull out names, assets and debts.",
      });
      await refetchDocuments();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadMsg("");
    }
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      await deleteDocument(id);
      await refetchDocuments();
    } catch {
      toast({ title: "Couldn't delete", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleDownloadDocument = async (id: number) => {
    try {
      const res = await apiRequest("GET", `/api/documents/${id}/download`);
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      toast({ title: "Couldn't open document", description: "Please try again.", variant: "destructive" });
    }
  };

  // Handle the return from Stripe Checkout (?payment=success|cancelled).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (!payment) return;
    if (payment === "success") {
      toast({
        title: "Payment received",
        description: "Thank you — your application is unlocked for submission.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    } else if (payment === "cancelled") {
      toast({
        title: "Checkout cancelled",
        description: "No payment was taken. You can pay whenever you're ready.",
      });
    }
    // Strip the query so a refresh doesn't re-trigger the toast.
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [queryClient, toast]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigateToTab = (tab: string) =>
    setActiveTab(DASHBOARD_TABS.includes(tab) ? tab : "documents");

  // A friendly title for the guided plan, e.g. "Margaret Hale's estate".
  const deceasedName = [
    (currentCase as any)?.deceasedFirstName,
    (currentCase as any)?.deceasedLastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const caseTitle = deceasedName ? `${deceasedName}'s estate` : "Your estate";

  const docCategories = [
    { id: "identification", icon: <Contact className="h-[19px] w-[19px]" />, title: "Identification", sub: "ID, passport, etc." },
    { id: "death_certificate", icon: <FileCheck className="h-[19px] w-[19px]" />, title: "Death Certificate", sub: "Official certificate" },
    { id: "will", icon: <PenLine className="h-[19px] w-[19px]" />, title: "Will & Codicils", sub: "Original will" },
    { id: "property", icon: <Home className="h-[19px] w-[19px]" />, title: "Property Valuations", sub: "Home, land, etc." },
  ];

  // Friendly label + badge styling for a document's processing status.
  const docStatusMeta = (status: string): { label: string; cls: string } => {
    switch (status) {
      case "processing":
        return { label: "Reading…", cls: "bg-[#E4EAF0] text-[#082D48]" };
      case "processed":
      case "verified":
        return { label: "Read", cls: "bg-[#DDEAD9] text-[#3F6B36]" };
      case "error":
        return { label: "Couldn't read", cls: "bg-[#F2E2D8] text-[#B5613C]" };
      default:
        return { label: status, cls: "bg-[#EFE7DA] text-[#8A8278]" };
    }
  };

  const resources = [
    {
      title: "How long does probate take?",
      desc: "Once submitted, the Probate Registry currently takes around 8–12 weeks to issue a grant. Valuing the estate beforehand often takes longer, as banks and other institutions can be slow to reply.",
    },
    {
      title: "What documents will I need?",
      desc: "Usually the death certificate, the original will (if there is one), and valuations or statements for the estate's assets and debts. We'll tell you exactly which apply to your case.",
    },
    {
      title: "When do I pay?",
      desc: "ProbateSwift is free to use while you prepare everything. You only pay the £295 fee at the point you're ready to submit.",
    },
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
            <div className="flex flex-col gap-6">
              {/* Pay £295 once the case is ready to submit (self-hides otherwise) */}
              {currentCase && <PaymentCta caseId={currentCase.id} />}

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
              {/* Shared hidden input — drives both the dropzone and the category cards */}
              <input
                ref={docInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = ""; // allow re-selecting the same file
                }}
              />

              <div className={cardCls}>
                <h2 className={cardTitleCls}>Upload Documents</h2>
                <p className={cardSubCls}>Add important files related to your probate application</p>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    pendingCategoryRef.current = "general";
                    handleFiles(e.dataTransfer.files);
                  }}
                  className="mt-6 flex flex-col items-center rounded-[18px] border-2 border-dashed border-[#D8CDBA] bg-[#FBF7EF] p-10 text-center"
                >
                  <div className="mb-[18px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#E4EAF0] text-[#082D48]">
                    {uploading ? <Loader2 className="h-[26px] w-[26px] animate-spin" /> : <Upload className="h-[26px] w-[26px]" />}
                  </div>
                  <div className="text-[19px] font-bold">{uploading ? "Uploading…" : "Drag & Drop Files"}</div>
                  <p className="mb-5 mt-1.5 text-[15px] text-[#5C6670]">
                    {uploading ? uploadMsg || "Please wait…" : "PDF, JPG, PNG, WebP or TIFF (max 20MB)"}
                  </p>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => openDocPicker("general")}
                    className={`${navyPillCls} disabled:cursor-not-allowed disabled:opacity-60`}
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
                        disabled={uploading}
                        onClick={() => openDocPicker(cat.id)}
                        className="w-full cursor-pointer rounded-[10px] border border-[#E3D9C9] bg-[#FBF7EF] py-2.5 text-[14px] font-semibold text-[#082D48] transition hover:bg-[#E4EAF0] disabled:cursor-not-allowed disabled:opacity-60"
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
                {visibleDocuments.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="h-7 w-7 text-[#082D48]" strokeWidth={2} />}
                    title="No Documents Yet"
                    body="Documents you upload will appear here, and we'll read them to pull out names, assets and debts."
                  />
                ) : (
                  <div className="mt-6 flex flex-col gap-3">
                    {visibleDocuments.map((doc) => {
                      const meta = docStatusMeta(doc.status ?? "processing");
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 rounded-[14px] border border-[#E3D9C9] bg-[#FBF7EF] p-4"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#E4EAF0] text-[#082D48]">
                            {doc.status === "processing" ? (
                              <Loader2 className="h-[18px] w-[18px] animate-spin" />
                            ) : doc.status === "error" ? (
                              <AlertCircle className="h-[18px] w-[18px]" />
                            ) : (
                              <CheckCircle2 className="h-[18px] w-[18px]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[15px] font-bold">{doc.filename}</div>
                            <span className={`mt-0.5 inline-block rounded-[6px] px-2 py-0.5 text-[12px] font-semibold ${meta.cls}`}>
                              {meta.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadDocument(doc.id)}
                            aria-label="Download"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5C6670] transition hover:bg-[#E4EAF0] hover:text-[#082D48]"
                          >
                            <Download className="h-[17px] w-[17px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            aria-label="Delete"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5C6670] transition hover:bg-[#F2E2D8] hover:text-[#B5613C]"
                          >
                            <Trash2 className="h-[17px] w-[17px]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              <GuidedTaskList
                caseId={currentCase.id}
                caseTitle={caseTitle}
                evaluationFlags={progress?.evaluationFlags}
                onStartEvaluation={() => setActiveTab("evaluation")}
                onNavigateToTab={navigateToTab}
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

          {/* HELP */}
          {activeTab === "help" && (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
              <div className="flex flex-col rounded-[22px] border border-[#E3D9C9] bg-white p-7 sm:p-8">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-[22px] w-[22px] text-[#082D48]" />
                  <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.015em]">Get help</h2>
                </div>
                <p className="m-0 mb-[22px] mt-1.5 text-[15px] text-[#8A8278]">
                  We're a small team and we read every message.
                </p>

                <p className="mb-6 text-[16px] leading-[1.6] text-[#5C6670]">
                  Stuck on a step, unsure what a question means, or want a human to look over your
                  case before you submit? Email us and a real person will get back to you — usually
                  within one working day.
                </p>

                <a
                  href="mailto:support@02n.ltd?subject=Help%20with%20my%20probate%20case"
                  className={`${navyPillCls} self-start no-underline`}
                >
                  <MessageSquare className="h-[18px] w-[18px]" /> Email support@02n.ltd
                </a>
              </div>

              <div className="rounded-[22px] border border-[#E3D9C9] bg-white p-7 sm:p-8">
                <h2 className="m-0 text-[24px] font-extrabold tracking-[-0.015em]">Quick answers</h2>
                <p className="m-0 mb-[22px] mt-1 text-[15px] text-[#8A8278]">
                  The questions we hear most
                </p>
                <div className="flex flex-col gap-[18px]">
                  {resources.map((res) => (
                    <div key={res.title} className="border-b border-[#EFE7DA] pb-[18px] last:border-b-0">
                      <div className="mb-1.5 flex items-center gap-2.5">
                        <FileText className="h-[17px] w-[17px] text-[#082D48]" />
                        <span className="text-[17px] font-bold">{res.title}</span>
                      </div>
                      <p className="m-0 text-[14px] leading-[1.5] text-[#5C6670]">{res.desc}</p>
                    </div>
                  ))}
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
