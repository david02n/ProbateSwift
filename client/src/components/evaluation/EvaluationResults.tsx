import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, FileText, Clock } from 'lucide-react';
import { deriveEvaluationFlags } from '@shared/evaluation-config';

interface EvaluationResultsProps {
  answers: Record<string, any>;
  onContinue: () => void;
  onRetakeEvaluation: () => void;
}

export function EvaluationResults({ answers, onContinue, onRetakeEvaluation }: EvaluationResultsProps) {
  const flags = deriveEvaluationFlags(answers);

  const complexity = flags.needs_specialist_advice
    ? 'complex'
    : flags.iht400_required
    ? 'moderate'
    : 'simple';

  const estateType = flags.estate_likely_excepted ? 'excepted' : 'non_excepted';
  const ihtFormLabel = flags.iht400_required
    ? 'IHT400'
    : flags.estate_likely_excepted
    ? 'none'
    : 'IHT205';

  const blockers: string[] = [];
  if (flags.application_blocked && flags.blocker_reason) {
    blockers.push(flags.blocker_reason);
  }

  const warnings: string[] = [];
  if (flags.has_foreign_assets) {
    warnings.push('Foreign assets require specialist handling.');
  }
  if (flags.married_after_will) {
    warnings.push('Marriage after making the will may affect its validity — seek legal advice.');
  }
  if (flags.needs_specialist_advice && !flags.has_foreign_assets && !flags.married_after_will) {
    warnings.push('This estate has characteristics that may benefit from specialist legal advice.');
  }

  const nextSteps: string[] = [...(flags.missing_requirements ?? [])];
  if (nextSteps.length === 0) {
    if (complexity === 'complex') {
      nextSteps.push('Consider professional legal advice');
      nextSteps.push('Gather comprehensive asset valuations');
      nextSteps.push('Prepare detailed IHT400 and supporting schedules');
    } else if (complexity === 'moderate') {
      nextSteps.push('Complete professional asset valuations');
      nextSteps.push('Prepare IHT400 form');
      nextSteps.push('Gather supporting documentation');
    } else {
      nextSteps.push('Complete basic asset valuations');
      if (ihtFormLabel !== 'none') {
        nextSteps.push(`Prepare ${ihtFormLabel} form`);
      }
      nextSteps.push('Upload will and death certificate');
      nextSteps.push('Submit probate application');
    }
  }

  const getComplexityColor = (c: string) => {
    switch (c) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityIcon = (c: string) => {
    switch (c) {
      case 'simple': return <CheckCircle className="h-4 w-4" />;
      case 'moderate': return <Clock className="h-4 w-4" />;
      case 'complex': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const estateTypeDesc =
    estateType === 'excepted'
      ? 'Your estate qualifies as an excepted estate, which means simplified probate procedures may apply.'
      : 'Your estate is classified as non-excepted, requiring standard probate procedures and IHT forms.';

  const summary = [
    estateType === 'excepted' ? 'Excepted Estate' : 'Non-Excepted Estate',
    flags.iht400_required ? 'IHT required (IHT400)' : ihtFormLabel !== 'none' ? `IHT form: ${ihtFormLabel}` : 'No IHT required',
    flags.probate_type === 'grant_of_probate' ? 'Grant of Probate' : 'Letters of Administration',
  ].join(' • ');

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Probate Path
          </CardTitle>
          <CardDescription>{summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge className={getComplexityColor(complexity)}>
                {getComplexityIcon(complexity)}
                {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {flags.iht400_required ? 'IHT400 required' : ihtFormLabel !== 'none' ? ihtFormLabel : 'No IHT form required'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm capitalize">
                {String(flags.probate_type).replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockers */}
      {blockers.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {blockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Considerations</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Estate Details */}
      <Card>
        <CardHeader>
          <CardTitle>Estate Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">
              Estate Type: {estateType.replace('_', ' ').toUpperCase()}
            </h4>
            <p className="text-sm text-muted-foreground">{estateTypeDesc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm">Probate Application Type</h5>
              <p className="text-sm text-muted-foreground capitalize">
                {String(flags.probate_type).replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-sm">IHT Requirements</h5>
              <p className="text-sm text-muted-foreground">
                {flags.iht400_required
                  ? 'IHT400 form required'
                  : 'No inheritance tax forms required'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Your Next Steps</CardTitle>
          <CardDescription>
            Complete these tasks to progress your probate application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </div>
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onContinue}
          className="flex-1"
          disabled={blockers.length > 0}
        >
          Continue to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
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
