
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
import { ArrowLeft, MapPin, Clock, DollarSign, User, Phone, Mail } from 'lucide-react';

const RequestDetails = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isResponding, setIsResponding] = useState(false);
  const [responseData, setResponseData] = useState({
    message: '',
    offered_items: [''],
    offered_amount: '',
    contact_info: {
      phone: profile?.phone || '',
      email: user?.email || '',
      organization: profile?.organization_name || ''
    }
  });

  const { data: request, isLoading } = useQuery({
    queryKey: ['help-request', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('help_requests')
        .select(`
          *,
          profiles!help_requests_farmer_id_fkey (full_name, phone, village, district, state)
        `)
        .eq('id', id)
        .single();
      return data;
    }
  });

  const { data: responses } = useQuery({
    queryKey: ['help-responses', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('help_responses')
        .select(`
          *,
          profiles!help_responses_helper_id_fkey (full_name, organization_name, role)
        `)
        .eq('request_id', id)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const respondMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('help_responses')
        .insert({
          request_id: id,
          helper_id: user.id,
          message: responseData.message,
          offered_items: responseData.offered_items.filter(item => item.trim() !== ''),
          offered_amount: responseData.offered_amount ? parseFloat(responseData.offered_amount) : null,
          contact_info: responseData.contact_info
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Response Submitted",
        description: "Your offer to help has been sent to the farmer.",
      });
      queryClient.invalidateQueries({ queryKey: ['help-responses', id] });
      setIsResponding(false);
      setResponseData({
        message: '',
        offered_items: [''],
        offered_amount: '',
        contact_info: {
          phone: profile?.phone || '',
          email: user?.email || '',
          organization: profile?.organization_name || ''
        }
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const assignRequestMutation = useMutation({
    mutationFn: async (responseId: string) => {
      if (!id) throw new Error('Request ID not found');
      
      const response = responses?.find(r => r.id === responseId);
      if (!response) throw new Error('Response not found');
      
      const { error } = await supabase
        .from('help_requests')
        .update({
          status: 'assigned',
          assigned_to: response.helper_id,
          assigned_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Mark the response as accepted
      await supabase
        .from('help_responses')
        .update({ is_accepted: true })
        .eq('id', responseId);
    },
    onSuccess: () => {
      toast({
        title: "Helper Assigned",
        description: "The helper has been assigned to your request.",
      });
      queryClient.invalidateQueries({ queryKey: ['help-request', id] });
      queryClient.invalidateQueries({ queryKey: ['help-responses', id] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRespond = () => {
    respondMutation.mutate();
  };

  const addOfferedItem = () => {
    setResponseData(prev => ({
      ...prev,
      offered_items: [...prev.offered_items, '']
    }));
  };

  const updateOfferedItem = (index: number, value: string) => {
    setResponseData(prev => ({
      ...prev,
      offered_items: prev.offered_items.map((item, i) => i === index ? value : item)
    }));
  };

  const removeOfferedItem = (index: number) => {
    setResponseData(prev => ({
      ...prev,
      offered_items: prev.offered_items.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Request Not Found</h1>
            <Button onClick={() => navigate('/help-requests')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Help Requests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canRespond = profile?.role === 'ngo' || profile?.role === 'donor';
  const canManageRequest = request.farmer_id === user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/help-requests')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Help Requests
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{request.title}</CardTitle>
                  <CardDescription className="text-lg">
                    {request.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col space-y-2">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                  <Badge className={getUrgencyColor(request.urgency)}>
                    {request.urgency}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-1">Category</h4>
                      <p className="text-gray-600 capitalize">{request.category}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Created</h4>
                      <div className="flex items-center text-gray-600">
                        <Clock className="mr-1 h-4 w-4" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Location</h4>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="mr-1 h-4 w-4" />
                      {request.location?.village}, {request.location?.district}, {request.location?.state}
                    </div>
                  </div>

                  {request.required_items && request.required_items.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Required Items</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {request.required_items.map((item: string, index: number) => (
                          <li key={index} className="text-gray-600">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {request.estimated_cost && (
                    <div>
                      <h4 className="font-semibold mb-1">Estimated Cost</h4>
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="mr-1 h-4 w-4" />
                        ₹{request.estimated_cost}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Responses */}
              <Card>
                <CardHeader>
                  <CardTitle>Helper Responses ({responses?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {responses && responses.length > 0 ? (
                    responses.map((response) => (
                      <div key={response.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">
                              {response.profiles?.full_name}
                              {response.profiles?.organization_name && (
                                <span className="text-sm text-gray-600 ml-2">
                                  ({response.profiles.organization_name})
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {new Date(response.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {response.is_accepted && (
                            <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-3">{response.message}</p>
                        
                        {response.offered_items && response.offered_items.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium mb-1">Offered Items:</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {response.offered_items.map((item: string, index: number) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {response.offered_amount && (
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Offered Amount:</strong> ₹{response.offered_amount}
                          </p>
                        )}
                        
                        {canManageRequest && request.status === 'pending' && !response.is_accepted && (
                          <Button 
                            onClick={() => assignRequestMutation.mutate(response.id)}
                            disabled={assignRequestMutation.isPending}
                            size="sm"
                          >
                            Accept This Helper
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No responses yet. Be the first to help!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Farmer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Farmer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{request.profiles?.full_name}</span>
                  </div>
                  {request.profiles?.phone && (
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-gray-500" />
                      <span>{request.profiles.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {request.profiles?.village}, {request.profiles?.district}, {request.profiles?.state}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              {canRespond && request.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Help This Farmer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={isResponding} onOpenChange={setIsResponding}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
                          Offer Help
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Offer Help to {request.profiles?.full_name}</DialogTitle>
                          <DialogDescription>
                            Provide details about how you can help with this request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="message">Your Message *</Label>
                            <Textarea
                              id="message"
                              value={responseData.message}
                              onChange={(e) => setResponseData(prev => ({
                                ...prev,
                                message: e.target.value
                              }))}
                              placeholder="Explain how you can help..."
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Items You Can Provide</Label>
                            {responseData.offered_items.map((item, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={item}
                                  onChange={(e) => updateOfferedItem(index, e.target.value)}
                                  placeholder="Enter item you can provide"
                                />
                                {responseData.offered_items.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeOfferedItem(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addOfferedItem}
                              size="sm"
                            >
                              Add Item
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="offered_amount">Financial Assistance (₹)</Label>
                            <Input
                              id="offered_amount"
                              type="number"
                              value={responseData.offered_amount}
                              onChange={(e) => setResponseData(prev => ({
                                ...prev,
                                offered_amount: e.target.value
                              }))}
                              placeholder="Amount you can contribute"
                            />
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-3">
                            <Label>Contact Information</Label>
                            <Input
                              value={responseData.contact_info.phone}
                              onChange={(e) => setResponseData(prev => ({
                                ...prev,
                                contact_info: { ...prev.contact_info, phone: e.target.value }
                              }))}
                              placeholder="Your phone number"
                            />
                            <Input
                              value={responseData.contact_info.email}
                              onChange={(e) => setResponseData(prev => ({
                                ...prev,
                                contact_info: { ...prev.contact_info, email: e.target.value }
                              }))}
                              placeholder="Your email"
                            />
                            {(profile?.role === 'ngo' || profile?.role === 'donor') && (
                              <Input
                                value={responseData.contact_info.organization}
                                onChange={(e) => setResponseData(prev => ({
                                  ...prev,
                                  contact_info: { ...prev.contact_info, organization: e.target.value }
                                }))}
                                placeholder="Organization name"
                              />
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsResponding(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleRespond} disabled={respondMutation.isPending}>
                            {respondMutation.isPending ? 'Submitting...' : 'Submit Offer'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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

export default RequestDetails;
