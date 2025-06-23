
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Users, Phone, Mail } from 'lucide-react';

const SchemeDetails = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isApplying, setIsApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({
    annual_income: '',
    land_area: '',
    crop_type: '',
    bank_account: '',
    additional_info: ''
  });

  const { data: scheme, isLoading } = useQuery({
    queryKey: ['scheme', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('schemes')
        .select('*')
        .eq('id', id)
        .single();
      return data;
    }
  });

  const { data: existingApplication } = useQuery({
    queryKey: ['scheme-application', id, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('scheme_applications')
        .select('*')
        .eq('scheme_id', id)
        .eq('farmer_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('scheme_applications')
        .insert({
          farmer_id: user.id,
          scheme_id: id,
          application_data: applicationData,
          status: 'submitted'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully. You will be notified of updates.",
      });
      queryClient.invalidateQueries({ queryKey: ['scheme-application', id, user?.id] });
      setIsApplying(false);
    },
    onError: (error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-100 text-green-800';
      case 'insurance': return 'bg-blue-100 text-blue-800';
      case 'subsidy': return 'bg-purple-100 text-purple-800';
      case 'loan': return 'bg-orange-100 text-orange-800';
      case 'equipment': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApply = () => {
    applyMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Scheme Not Found</h1>
            <Button onClick={() => navigate('/schemes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Schemes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/schemes')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schemes
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{scheme.name}</CardTitle>
                  <CardDescription className="text-lg">
                    {scheme.description}
                  </CardDescription>
                </div>
                <Badge className={getCategoryColor(scheme.category)}>
                  {scheme.category}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{scheme.benefits}</p>
                </CardContent>
              </Card>

              {/* Eligibility */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Eligibility Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(scheme.eligibility_criteria).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium capitalize mr-2">{key.replace('_', ' ')}:</span>
                        <span className="text-gray-700">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Application Process */}
              <Card>
                <CardHeader>
                  <CardTitle>How to Apply</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{scheme.application_process}</p>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h4 className="font-semibold mb-2">Required Documents:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {scheme.required_documents.map((doc: string, index: number) => (
                        <li key={index} className="text-gray-700">{doc}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {existingApplication ? (
                    <div className="text-center">
                      <Badge className="mb-2">
                        {existingApplication.status}
                      </Badge>
                      <p className="text-sm text-gray-600">
                        Applied on {new Date(existingApplication.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ) : profile?.role === 'farmer' ? (
                    <Dialog open={isApplying} onOpenChange={setIsApplying}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
                          Apply Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Apply for {scheme.name}</DialogTitle>
                          <DialogDescription>
                            Please provide the required information to submit your application.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="annual_income">Annual Income (₹)</Label>
                            <Input
                              id="annual_income"
                              value={applicationData.annual_income}
                              onChange={(e) => setApplicationData(prev => ({
                                ...prev,
                                annual_income: e.target.value
                              }))}
                              placeholder="Enter your annual income"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="land_area">Land Area (acres)</Label>
                            <Input
                              id="land_area"
                              value={applicationData.land_area}
                              onChange={(e) => setApplicationData(prev => ({
                                ...prev,
                                land_area: e.target.value
                              }))}
                              placeholder="Enter land area"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="crop_type">Primary Crop Type</Label>
                            <Input
                              id="crop_type"
                              value={applicationData.crop_type}
                              onChange={(e) => setApplicationData(prev => ({
                                ...prev,
                                crop_type: e.target.value
                              }))}
                              placeholder="Enter primary crop"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bank_account">Bank Account Number</Label>
                            <Input
                              id="bank_account"
                              value={applicationData.bank_account}
                              onChange={(e) => setApplicationData(prev => ({
                                ...prev,
                                bank_account: e.target.value
                              }))}
                              placeholder="Enter bank account number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="additional_info">Additional Information</Label>
                            <Textarea
                              id="additional_info"
                              value={applicationData.additional_info}
                              onChange={(e) => setApplicationData(prev => ({
                                ...prev,
                                additional_info: e.target.value
                              }))}
                              placeholder="Any additional information"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsApplying(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleApply} disabled={applyMutation.isPending}>
                            {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <p className="text-center text-gray-600">
                      Sign in as a farmer to apply for this scheme.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              {scheme.contact_details && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {scheme.contact_details.website && (
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-gray-500" />
                        <a 
                          href={`https://${scheme.contact_details.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {scheme.contact_details.website}
                        </a>
                      </div>
                    )}
                    {scheme.contact_details.helpline && (
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-500" />
                        <span>{scheme.contact_details.helpline}</span>
                      </div>
                    )}
                    {scheme.contact_details.email && (
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-500" />
                        <a 
                          href={`mailto:${scheme.contact_details.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {scheme.contact_details.email}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemeDetails;
