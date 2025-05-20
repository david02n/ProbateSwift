import React from 'react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import NewHeader from '@/components/layout/NewHeader';
import DeceasedDetailsForm from '@/components/deceased/DeceasedDetailsForm';

const DeceasedDetailsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NewHeader />
      <DeceasedDetailsForm />
    </div>
  );
};

export default DeceasedDetailsPage;