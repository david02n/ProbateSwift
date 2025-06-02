import React from "react";
import { usePersonCompletion } from "@/hooks/use-person-completion";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

interface PersonCompletionStatusProps {
  personId: number;
  personName: string;
}

export default function PersonCompletionStatus({ personId, personName }: PersonCompletionStatusProps) {
  const { data: completionStatus, isLoading } = usePersonCompletion(personId);

  if (isLoading) {
    return (
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Checking...
      </span>
    );
  }

  if (!completionStatus) {
    return null;
  }

  if (completionStatus.complete) {
    return (
      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center">
        <Check className="h-3 w-3 mr-1" />
        Complete
      </span>
    );
  }

  return (
    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Needs information
    </span>
  );
}

// Hook to get completion status for use in parent components
export function usePersonCompletionStatus(personId: number) {
  const { data: completionStatus, isLoading } = usePersonCompletion(personId);
  
  return {
    isComplete: completionStatus?.complete || false,
    missingFields: completionStatus?.missingFields || [],
    isLoading,
    needsMoreInfo: !completionStatus?.complete && !isLoading
  };
}