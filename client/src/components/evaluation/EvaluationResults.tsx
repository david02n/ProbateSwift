import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, FileText, Clock, Users, Scale } from 'lucide-react';
import {
  deriveFlags,
  deriveSpecialist,
  deriveReadiness,
  amberFlagKeys,
} from '@shared/evaluation-config';
import { apiRequest } from '@/lib/queryClient';

interface EvaluationResultsProps {
  answers: Record<string, any>;
  caseId?: number;
  applicantRole?: 'applicant' | 'helper';
  amberAcknowledgements?: Record<string, { by: string; at: string }>;
  onContinue: () => void;
  onRetakeEvaluation: () => void;
}

export function EvaluationResults({
  answers,
  caseId,
  applicantRole = 'applicant',
  amberAcknowledgements = {},
  onContinue,
  onRetakeEvaluation,
}: EvaluationResultsProps) {
  const flags = deriveFlags(answers);
  const specialist = deriveSpecialist(answers);
  const amberKeys = amberFlagKeys(answers);

  const [acknowledgedLocally, setAcknowledgedLocally] = useState(false);
  const [referred, setReferred] = useState(false);
  const [busy, setBusy] = useState(false);

  const amberAcknowledged =
    acknowledgedLocally ||
    (amberKeys.length > 0 && amberKeys.every((k) => amberAcknowledgements[k]));

  const readiness = deriveReadiness(flags, {
    applicantRole,
    amberAcknowledged,
    structuralRequirementsMet: (flags.structural_blockers ?? []).length === 0,
  });

  const grantLabel =
    flags.grant_needed === 'needed'
      ? 'A grant is needed'
      : flags.grant_needed === 'probably_needed'
      ? 'A grant is probably needed'
      : 'A grant is probably not needed';

  const probateTypeLabel = String(flags.probate_type ?? '').replace(/_/g, ' ');

  async function acknowledgeAmber() {
    if (!caseId) {
      setAcknowledgedLocally(true);
      return;
    }
    setBusy(true);
    try {
      await apiRequest('POST', `/api/intake/${caseId}/acknowledge`, { all: true });
      setAcknowledgedLocally(true);
    } finally {
      setBusy(false);
    }
  }

  async function refer() {
    if (!caseId) {
      setReferred(true);
      return;
    }
    setBusy(true);
    try {
      await apiRequest('POST', `/api/intake/${caseId}/referral`, { consent: true });
      setReferred(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header — probate path summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Probate Path
          </CardTitle>
          <CardDescription>
            {grantLabel}
            {flags.probate_type ? ` • ${probateTypeLabel}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-slate-100 text-slate-800 capitalize">{probateTypeLabel || 'Application'}</Badge>
            {flags.has_will && <Badge className="bg-lavender/20 text-charcoal">Will exists</Badge>}
            {specialist.specialistSeverity === 'red' && (
              <Badge className="bg-red-100 text-red-800">Specialist recommended</Badge>
            )}
            {specialist.specialistSeverity === 'amber' && (
              <Badge className="bg-yellow-100 text-yellow-800">Worth a closer look</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Readiness router ─────────────────────────────────────────────── */}

      {readiness.route === 'specialist' && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Scale className="h-5 w-5" />
              A solicitor is the safer route
            </CardTitle>
            <CardDescription>
              Your situation has factors that we believe need specialist legal advice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {readiness.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            {referred ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Referral sent</AlertTitle>
                <AlertDescription>
                  We’ve shared a short summary of your case with a partner solicitor. They’ll be in touch — you don’t need to re-explain anything.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  With your consent, we’ll send a short summary of your case (with/without a will, estate band, and the flags above) to a partner solicitor so you don’t have to start over.
                </p>
                <Button onClick={refer} disabled={busy} className="bg-primary">
                  Refer my case with consent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Payment is paused while a specialist flag is active. You can still explore your dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {readiness.route === 'fix_required' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>A couple of things to fix first</AlertTitle>
          <AlertDescription>
            <p className="mb-2 text-sm">
              These would make the application invalid, so we’ll sort them before generating your forms:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {readiness.structuralBlockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {readiness.route === 'handoff' && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              You can prepare everything — someone else signs it
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You can gather the information, pay, and generate the forms. The final statement of truth must be signed and submitted by the person entitled to apply. When you’re ready, invite them to take over.
            </p>
            <Button onClick={onContinue} className="bg-primary">
              Continue preparing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {readiness.route === 'ready' && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              You’re ready to continue
            </CardTitle>
            <CardDescription>
              Everything checks out. You can complete your forms and pay when you’re ready to submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onContinue} className="bg-primary">
              Continue to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Amber flags — dismissible, never blocking the journey beyond payment */}
      {specialist.specialistSeverity === 'amber' && !amberAcknowledged && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Worth a closer look (but you can continue)</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-1 mb-3">
              {specialist.specialistReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <Button variant="outline" size="sm" onClick={acknowledgeAmber} disabled={busy}>
              These are minor — continue
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* IHT is a timing warning, not a blocker — the product fills the IHT400 */}
      {flags.iht_timing_warning && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Inheritance tax timing</AlertTitle>
          <AlertDescription>{flags.iht_timing_warning}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={onRetakeEvaluation}>
          Retake Evaluation
        </Button>
      </div>

      <div className="text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg">
        <p>
          This assessment is based on the information you provided. Estate requirements can be complex,
          and this guidance should not replace professional legal or tax advice. If you're unsure about
          any aspect of your probate application, consider consulting with a qualified professional.
        </p>
      </div>
    </div>
  );
}
