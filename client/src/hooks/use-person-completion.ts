import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export interface PersonCompletionStatus {
  complete: boolean;
  missingFields: string[];
}

export function usePersonCompletion(personId: number | undefined) {
  return useQuery<PersonCompletionStatus>({
    queryKey: [`/api/people/${personId}/complete`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!personId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}