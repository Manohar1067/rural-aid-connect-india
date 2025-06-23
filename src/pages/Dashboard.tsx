
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Heart, Users, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuth();

  const { data: schemes } = useQuery({
    queryKey: ['schemes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('schemes')
        .select('*')
        .eq('is_active', true)
        .limit(3);
      return data || [];
    }
  });

  const { data: helpRequests } = useQuery({
    queryKey: ['help-requests', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      if (profile.role === 'farmer') {
        const { data } = await supabase
          .from('help_requests')
          .select('*')
          .eq('farmer_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);
        return data || [];
      } else {
        const { data } = await supabase
          .from('help_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);
        return data || [];
      }
    },
    enabled: !!profile?.id
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            {profile?.role === 'farmer' 
              ? 'Manage your schemes and requests from your dashboard.'
              : 'Help farmers in need and make a difference in agriculture.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Schemes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schemes?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Government programs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.role === 'farmer' ? 'My Requests' : 'Pending Requests'}
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{helpRequests?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Help requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">Active members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">Requests fulfilled</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Schemes */}
          <Card>
            <CardHeader>
              <CardTitle>Available Government Schemes</CardTitle>
              <CardDescription>
                Recent schemes you can apply for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {schemes && schemes.length > 0 ? (
                schemes.map((scheme) => (
                  <div key={scheme.id} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{scheme.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{scheme.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline">{scheme.category}</Badge>
                      <Link to={`/schemes/${scheme.id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No schemes available</p>
              )}
              <Link to="/schemes">
                <Button variant="outline" className="w-full">
                  View All Schemes
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Help Requests */}
          <Card>
            <CardHeader>
              <CardTitle>
                {profile?.role === 'farmer' ? 'My Help Requests' : 'Pending Help Requests'}
              </CardTitle>
              <CardDescription>
                {profile?.role === 'farmer' 
                  ? 'Track your submitted requests'
                  : 'Requests waiting for assistance'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {helpRequests && helpRequests.length > 0 ? (
                helpRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{request.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency}
                        </Badge>
                      </div>
                      <Link to={`/help-requests/${request.id}`}>
                        <Button size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {profile?.role === 'farmer' 
                    ? 'No requests submitted yet'
                    : 'No pending requests'
                  }
                </p>
              )}
              <div className="flex space-x-2">
                <Link to="/help-requests" className="flex-1">
                  <Button variant="outline" className="w-full">
                    View All
                  </Button>
                </Link>
                {profile?.role === 'farmer' && (
                  <Link to="/help-requests/new" className="flex-1">
                    <Button className="w-full">
                      New Request
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
