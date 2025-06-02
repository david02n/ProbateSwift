import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, ArrowRight } from 'lucide-react';

interface DeceasedFormStatusProps {
  executorId: number;
}

const DeceasedFormStatus: React.FC<DeceasedFormStatusProps> = ({ executorId }) => {
  const [, navigate] = useLocation();
  
  // Query for checking if the deceased form fields are complete
  const { data: completionData, isLoading } = useQuery({
    queryKey: [`/api/deceased-form-fields/${executorId}/complete`],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/deceased-form-fields/${executorId}/complete`);
        if (!response.ok) {
          // If we get a 404, it means the form hasn't been started yet
          if (response.status === 404) {
            return { complete: false, exists: false };
          }
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to check deceased form completion');
        }
        const data = await response.json();
        return { ...data, exists: true };
      } catch (error) {
        console.error('Error checking deceased form completion:', error);
        return { complete: false, exists: false };
      }
    },
    // Refresh every 30 seconds and when component mounts
    refetchInterval: 30000,
  });

  const isComplete = completionData?.complete || false;
  const formExists = completionData?.exists || false;
  const missingFields = completionData?.missingFields || [];

  const handleNavigateToForm = () => {
    navigate(`/people/${executorId}/deceased-details`);
  };

  if (isLoading) {
    return <span className="text-xs italic text-gray-500">Checking status...</span>;
  }

  return (
    <div className="mt-2">
      {isComplete ? (
        <div className="flex items-center">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center mr-2">
            <Check className="h-3 w-3 mr-1" />
            Details Complete
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNavigateToForm}
            className="h-6 px-2 text-xs"
          >
            Edit Details
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center">
            {formExists ? (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center mr-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Incomplete
              </span>
            ) : null}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNavigateToForm}
              className="h-6 text-xs"
            >
              {formExists ? 'Continue' : 'Complete Deceased Details'}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {missingFields.length > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              <div className="font-medium mb-1">Missing:</div>
              <div className="space-y-0.5">
                {missingFields.slice(0, 3).map((field, index) => (
                  <div key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-amber-500 rounded-full mr-2"></span>
                    {field}
                  </div>
                ))}
                {missingFields.length > 3 && (
                  <div className="text-amber-600 italic">
                    +{missingFields.length - 3} more fields
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeceasedFormStatus;