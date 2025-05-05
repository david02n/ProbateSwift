import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import NewHeader from "@/components/layout/NewHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Home,
  PoundSterling,
  CreditCard,
  Landmark,
  Plus,
  Car,
  Banknote,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Pencil,
  Trash
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { EstateAsset, EstateLiability, ProbateCase } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssetForm, { AssetFormValues } from "@/components/estate/AssetForm";
import LiabilityForm, { LiabilityFormValues } from "@/components/estate/LiabilityForm";

interface Asset extends EstateAsset {
  name?: string;
  icon?: React.ReactNode;
}

interface Liability extends EstateLiability {
  name?: string;
  icon?: React.ReactNode;
}

const EstatePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get the user's probate cases
  const { 
    data: probateCases,
    isLoading: isLoadingCases 
  } = useQuery<ProbateCase[]>({
    queryKey: ["/api/probate-cases"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Get the active case ID (first case for now, could be selected by user later)
  const activeCaseId = probateCases && probateCases.length > 0 ? probateCases[0].id : undefined;
  
  // Get assets for the active case
  const { 
    data: assets = [],
    isLoading: isLoadingAssets 
  } = useQuery<EstateAsset[]>({
    queryKey: ["/api/assets", activeCaseId],
    queryFn: activeCaseId ? getQueryFn({ on401: "throw" }) : () => Promise.resolve([]),
    enabled: !!activeCaseId,
  });
  
  // Get liabilities for the active case
  const { 
    data: liabilities = [],
    isLoading: isLoadingLiabilities 
  } = useQuery<EstateLiability[]>({
    queryKey: ["/api/liabilities", activeCaseId],
    queryFn: activeCaseId ? getQueryFn({ on401: "throw" }) : () => Promise.resolve([]),
    enabled: !!activeCaseId,
  });
  
  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: async (assetData: Partial<EstateAsset>) => {
      const res = await apiRequest("POST", "/api/assets", assetData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets", activeCaseId] });
      toast({
        title: "Asset added",
        description: "The asset has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create liability mutation
  const createLiabilityMutation = useMutation({
    mutationFn: async (liabilityData: Partial<EstateLiability>) => {
      const res = await apiRequest("POST", "/api/liabilities", liabilityData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/liabilities", activeCaseId] });
      toast({
        title: "Liability added",
        description: "The liability has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding liability",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Process assets with icons
  const processedAssets: Asset[] = assets.map(asset => {
    let icon;
    let name;
    
    switch(asset.type) {
      case "property":
        icon = <Home className="h-5 w-5" />;
        name = asset.description || "Property";
        break;
      case "bank_account":
        icon = <Landmark className="h-5 w-5" />;
        name = asset.description || "Bank Account";
        break;
      case "investment":
        icon = <TrendingUp className="h-5 w-5" />;
        name = asset.description || "Investment";
        break;
      case "vehicle":
        icon = <Car className="h-5 w-5" />;
        name = asset.description || "Vehicle";
        break;
      case "cash":
        icon = <Banknote className="h-5 w-5" />;
        name = asset.description || "Cash";
        break;
      default:
        icon = <PoundSterling className="h-5 w-5" />;
        name = asset.description || "Asset";
    }
    
    return { ...asset, icon, name };
  });
  
  // Process liabilities with icons
  const processedLiabilities: Liability[] = liabilities.map(liability => {
    let icon;
    let name;
    
    switch(liability.type) {
      case "mortgage":
        icon = <Home className="h-5 w-5" />;
        name = liability.description || "Mortgage";
        break;
      case "loan":
        icon = <CreditCard className="h-5 w-5" />;
        name = liability.description || "Loan";
        break;
      case "credit_card":
        icon = <CreditCard className="h-5 w-5" />;
        name = liability.description || "Credit Card";
        break;
      default:
        icon = <PoundSterling className="h-5 w-5" />;
        name = liability.description || "Liability";
    }
    
    return { ...liability, icon, name };
  });
  
  // Calculate totals
  const totalAssets = processedAssets.reduce((sum, asset) => {
    return sum + (asset.value ? parseFloat(asset.value.toString()) : 0);
  }, 0);
  
  const totalLiabilities = processedLiabilities.reduce((sum, liability) => {
    return sum + (liability.amount ? parseFloat(liability.amount.toString()) : 0);
  }, 0);
  
  const netEstate = totalAssets - totalLiabilities;
  
  // IHT calculations (simplified)
  const ihtThreshold = 325000;
  const taxableAmount = Math.max(0, netEstate - ihtThreshold);
  const taxRate = 0.4;
  const taxDue = taxableAmount * taxRate;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Asset/liability modal state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<EstateAsset | undefined>(undefined);
  const [selectedLiability, setSelectedLiability] = useState<EstateLiability | undefined>(undefined);
  
  // Handle add/edit asset
  const handleAddAsset = () => {
    if (!activeCaseId) {
      toast({
        title: "No probate case",
        description: "Please create a probate case first",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedAsset(undefined); // Reset selected asset for adding new
    setIsAssetModalOpen(true);
  };
  
  // Handle edit asset
  const handleEditAsset = (asset: EstateAsset) => {
    setSelectedAsset(asset);
    setIsAssetModalOpen(true);
  };
  
  // Handle asset form submission
  const handleAssetSubmit = (data: any) => {
    if (!activeCaseId) return;
    
    if (selectedAsset) {
      // Edit existing asset
      // This would be implemented in a future update
      toast({
        title: "Feature coming soon",
        description: "Editing assets will be available in a future update",
      });
      setIsAssetModalOpen(false);
    } else {
      // Create new asset
      createAssetMutation.mutate({
        caseId: activeCaseId,
        type: data.type,
        description: data.description,
        value: data.value,
        address: data.address,
        institution: data.institution,
        accountNumber: data.accountNumber,
        notes: data.notes,
      });
      setIsAssetModalOpen(false);
    }
  };
  
  // Handle add/edit liability
  const handleAddLiability = () => {
    if (!activeCaseId) {
      toast({
        title: "No probate case",
        description: "Please create a probate case first",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedLiability(undefined); // Reset selected liability for adding new
    setIsLiabilityModalOpen(true);
  };
  
  // Handle edit liability
  const handleEditLiability = (liability: EstateLiability) => {
    setSelectedLiability(liability);
    setIsLiabilityModalOpen(true);
  };
  
  // Handle liability form submission
  const handleLiabilitySubmit = (data: any) => {
    if (!activeCaseId) return;
    
    if (selectedLiability) {
      // Edit existing liability
      // This would be implemented in a future update
      toast({
        title: "Feature coming soon",
        description: "Editing liabilities will be available in a future update",
      });
      setIsLiabilityModalOpen(false);
    } else {
      // Create new liability
      createLiabilityMutation.mutate({
        caseId: activeCaseId,
        type: data.type,
        description: data.description,
        amount: data.amount,
        creditor: data.creditor,
        accountNumber: data.accountNumber,
        notes: data.notes,
      });
      setIsLiabilityModalOpen(false);
    }
  };
  
  const isLoading = isLoadingCases || isLoadingAssets || isLoadingLiabilities;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NewHeader />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Loading estate information...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!activeCaseId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NewHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Estate</h1>
              <p className="text-gray-600">
                Manage the assets and liabilities of the estate
              </p>
            </div>
            
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-4">No probate case found. Please complete the assessment first to create a probate case.</p>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => window.location.href = "/"}>
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NewHeader />
      
      {/* Asset Form Modal */}
      <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
            <DialogDescription>
              {selectedAsset 
                ? 'Update the asset information below.' 
                : 'Enter the details of the asset below.'
              }
            </DialogDescription>
          </DialogHeader>
          <AssetForm 
            onSubmit={handleAssetSubmit}
            initialData={selectedAsset}
            isSubmitting={createAssetMutation.isPending}
            onCancel={() => setIsAssetModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Liability Form Modal */}
      <Dialog open={isLiabilityModalOpen} onOpenChange={setIsLiabilityModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedLiability ? 'Edit Liability' : 'Add New Liability'}</DialogTitle>
            <DialogDescription>
              {selectedLiability
                ? 'Update the liability information below.'
                : 'Enter the details of the liability below.'
              }
            </DialogDescription>
          </DialogHeader>
          <LiabilityForm 
            onSubmit={handleLiabilitySubmit}
            initialData={selectedLiability}
            isSubmitting={createLiabilityMutation.isPending}
            onCancel={() => setIsLiabilityModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Estate</h1>
            <p className="text-gray-600">
              Manage the assets and liabilities of the estate
            </p>
          </div>
          
          {/* Estate Summary Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PoundSterling className="h-5 w-5 mr-2 text-primary" />
                Estate Value Summary
              </CardTitle>
              <CardDescription>
                Total value of the estate and inheritance tax estimate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Assets */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Total Assets</span>
                    <span className="font-medium text-lg">{formatCurrency(totalAssets)}</span>
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    <span>Assets</span>
                  </div>
                </div>
                
                {/* Liabilities */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Total Liabilities</span>
                    <span className="font-medium text-lg">{formatCurrency(totalLiabilities)}</span>
                  </div>
                  <div className="flex items-center text-sm text-red-600">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    <span>Debts</span>
                  </div>
                </div>
                
                {/* Net Estate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Net Estate Value</span>
                    <span className="font-medium text-lg">{formatCurrency(netEstate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PoundSterling className="h-4 w-4 mr-1" />
                    <span>After debts</span>
                  </div>
                </div>
              </div>
              
              {/* IHT Section */}
              <div className="mt-8 border-t pt-6">
                <h3 className="font-medium mb-3">Inheritance Tax Estimate</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Tax-free threshold</span>
                        <span>{formatCurrency(ihtThreshold)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Taxable amount</span>
                        <span>{formatCurrency(taxableAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Tax rate</span>
                        <span>{taxRate * 100}%</span>
                      </div>
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-gray-800">Estimated tax due</span>
                        <span>{formatCurrency(taxDue)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      This is an estimate only. The final tax calculation will depend on various factors including exemptions and reliefs.
                    </p>
                    <Button variant="outline" className="w-full">
                      View Tax Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Assets and Liabilities Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Assets Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowUpRight className="h-5 w-5 mr-2 text-green-600" />
                  Assets
                </CardTitle>
                <CardDescription>
                  Property, financial accounts, and other assets owned by the deceased
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processedAssets.length > 0 ? (
                    processedAssets.map((asset) => (
                      <div key={asset.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                        <div className="flex justify-between">
                          <div className="flex">
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">
                              {asset.icon}
                            </div>
                            <div>
                              <h4 className="font-medium">{asset.name}</h4>
                              <p className="text-sm text-gray-500">{asset.institution || asset.address || ""}</p>
                            </div>
                          </div>
                          <div className="font-medium text-green-600">
                            {asset.value ? formatCurrency(parseFloat(asset.value.toString())) : "£0"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No assets have been added yet.</p>
                    </div>
                  )}
                  
                  {/* Add Asset Button */}
                  <div className="border rounded-lg border-dashed p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                    <Plus className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 mb-2">Add another asset</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddAsset}
                      disabled={createAssetMutation.isPending}
                    >
                      {createAssetMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Asset"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <span className="text-gray-600">Total Assets</span>
                <span className="font-medium">{formatCurrency(totalAssets)}</span>
              </CardFooter>
            </Card>
            
            {/* Liabilities Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowDownRight className="h-5 w-5 mr-2 text-red-600" />
                  Liabilities
                </CardTitle>
                <CardDescription>
                  Mortgages, loans, credit cards, and other debts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processedLiabilities.length > 0 ? (
                    processedLiabilities.map((liability) => (
                      <div key={liability.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                        <div className="flex justify-between">
                          <div className="flex">
                            <div className="h-10 w-10 rounded-md bg-red-100 flex items-center justify-center text-red-600 mr-3">
                              {liability.icon}
                            </div>
                            <div>
                              <h4 className="font-medium">{liability.name}</h4>
                              <p className="text-sm text-gray-500">{liability.creditor || liability.description}</p>
                            </div>
                          </div>
                          <div className="font-medium text-red-600">
                            {liability.amount ? formatCurrency(parseFloat(liability.amount.toString())) : "£0"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No liabilities have been added yet.</p>
                    </div>
                  )}
                  
                  {/* Add Liability Button */}
                  <div className="border rounded-lg border-dashed p-4 text-center hover:bg-gray-50 transition cursor-pointer">
                    <Plus className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 mb-2">Add another liability</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddLiability}
                      disabled={createLiabilityMutation.isPending}
                    >
                      {createLiabilityMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Liability"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <span className="text-gray-600">Total Liabilities</span>
                <span className="font-medium">{formatCurrency(totalLiabilities)}</span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EstatePage;