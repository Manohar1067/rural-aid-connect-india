
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const CreateRequest = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    required_items: [''],
    estimated_cost: ''
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !profile) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('help_requests')
        .insert({
          farmer_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          urgency: formData.urgency,
          location: {
            state: profile.state,
            district: profile.district,
            village: profile.village
          },
          required_items: formData.required_items.filter(item => item.trim() !== ''),
          estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Request Created",
        description: "Your help request has been submitted successfully.",
      });
      navigate('/help-requests');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    createRequestMutation.mutate();
  };

  const addRequiredItem = () => {
    setFormData(prev => ({
      ...prev,
      required_items: [...prev.required_items, '']
    }));
  };

  const updateRequiredItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      required_items: prev.required_items.map((item, i) => i === index ? value : item)
    }));
  };

  const removeRequiredItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_items: prev.required_items.filter((_, i) => i !== index)
    }));
  };

  if (profile?.role !== 'farmer') {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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

        <Card>
          <CardHeader>
            <CardTitle>Create New Help Request</CardTitle>
            <CardDescription>
              Submit a request for assistance with farming needs. Our community of NGOs and donors will review and respond to your request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of what you need"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about your situation and needs"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seeds">Seeds</SelectItem>
                      <SelectItem value="fertilizers">Fertilizers</SelectItem>
                      <SelectItem value="tools">Tools & Equipment</SelectItem>
                      <SelectItem value="irrigation">Irrigation</SelectItem>
                      <SelectItem value="pest_control">Pest Control</SelectItem>
                      <SelectItem value="financial">Financial Assistance</SelectItem>
                      <SelectItem value="emergency">Emergency Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select value={formData.urgency} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setFormData(prev => ({ ...prev, urgency: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Can wait a few weeks</SelectItem>
                      <SelectItem value="medium">Medium - Needed within a week</SelectItem>
                      <SelectItem value="high">High - Needed within 2-3 days</SelectItem>
                      <SelectItem value="critical">Critical - Urgent, immediate help needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Required Items/Assistance</Label>
                {formData.required_items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateRequiredItem(index, e.target.value)}
                      placeholder="Enter required item"
                    />
                    {formData.required_items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeRequiredItem(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRequiredItem}
                  className="w-full"
                >
                  Add Another Item
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Estimated Cost (₹)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: e.target.value }))}
                  placeholder="Optional: Estimated cost of assistance needed"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Your Location</h4>
                <p className="text-blue-800">
                  {profile?.village}, {profile?.district}, {profile?.state}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  This will help nearby helpers identify and respond to your request.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/help-requests')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRequestMutation.isPending}
                  className="flex-1"
                >
                  {createRequestMutation.isPending ? 'Creating...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateRequest;
