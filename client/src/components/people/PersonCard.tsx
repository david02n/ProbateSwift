import React from "react";
import { Button } from "@/components/ui/button";
import { User, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Executor } from "@shared/schema";
import DeceasedFormStatus from "@/components/deceased/DeceasedFormStatus";
import PersonCompletionStatus, { usePersonCompletionStatus } from "./PersonCompletionStatus";

interface PersonCardProps {
  executor: Executor;
  onEdit: (executor: Executor) => void;
  onDelete: (executor: Executor) => void;
}

export default function PersonCard({ executor, onEdit, onDelete }: PersonCardProps) {
  const { isComplete, missingFields, needsMoreInfo } = usePersonCompletionStatus(executor.id);

  return (
    <div 
      className={`border rounded-lg p-5 ${
        executor.isPrimary ? 'border-primary/20 bg-primary/5' : ''
      }`}
    >
      <div className="flex justify-between">
        <div className="flex items-start">
          <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-4 ${
            needsMoreInfo ? 'bg-amber-100 text-amber-600' :
            executor.isPrimary ? 'bg-primary text-white' : 
            'bg-gray-200'
          }`}>
            {needsMoreInfo ? 
              <AlertTriangle className="h-5 w-5" /> : 
              <User className="h-5 w-5" />
            }
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-medium text-lg">
                {executor.firstName} {executor.lastName}
              </h3>
              {executor.isPrimary && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Primary Applicant
                </span>
              )}
              {executor.isExecutor && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Executor
                </span>
              )}
              {executor.relationshipToDeceased === 'Deceased' && (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                  Deceased
                </span>
              )}
              
              {/* Use proper completion status validation */}
              {executor.relationshipToDeceased === 'Deceased' ? (
                <DeceasedFormStatus executorId={executor.id} />
              ) : (
                <PersonCompletionStatus personId={executor.id} personName={`${executor.firstName} ${executor.lastName}`} />
              )}
              
              {executor.documentId && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Auto-created from document
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {executor.relationshipToDeceased || "Relationship not specified"} 
              {needsMoreInfo && (
                <span className="text-amber-600 ml-2 text-xs">
                  Please complete all required fields
                </span>
              )}
            </p>
            {needsMoreInfo && missingFields.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="font-medium text-amber-800">Missing: </span>
                <span className="text-amber-600">{missingFields.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(executor)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(executor)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}