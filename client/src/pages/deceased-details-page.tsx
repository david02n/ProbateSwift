import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import NewHeader from '@/components/layout/NewHeader';
import DeceasedDetailsForm from '@/components/deceased/DeceasedDetailsForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DeceasedDetailsPage: React.FC = () => {
  const params = useParams<{ personId: string }>();
  const personId = parseInt(params.personId, 10);
  const [, navigate] = useLocation();
  
  // Fetch the person's details to display their name in the header
  const { data: person, isLoading: isLoadingPerson } = useQuery({
    queryKey: [`/api/executors/${personId}`],
    enabled: !isNaN(personId),
  });

  if (isNaN(personId)) {
    return (
      <AuthenticatedLayout>
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Invalid person ID. Please go back and try again.</p>
              <Button onClick={() => navigate('/people')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to People
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  const handleBackClick = () => {
    navigate('/people');
  };

  return (
    <AuthenticatedLayout>
      <div className="container py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={handleBackClick} 
              className="mr-2 md:mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to People
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isLoadingPerson ? (
                  <Skeleton className="h-8 w-48" />
                ) : (
                  <>Deceased Details: {person?.firstName} {person?.lastName}</>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Complete the deceased person's information for probate
              </p>
            </div>
          </div>
        </div>

        <DeceasedDetailsForm personId={personId} />
      </div>
    </AuthenticatedLayout>
  );
};

export default DeceasedDetailsPage;