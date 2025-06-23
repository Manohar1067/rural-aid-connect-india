
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Heart, Users, CheckCircle, Clock, MapPin, AlertTriangle } from 'lucide-react';

const NGODashboard = () => {
  const { profile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['ngo-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      // Get total pending requests
      const { count: pendingCount } = await supabase
        .from('help_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Get requests assigned to this helper
      const { count: assignedCount } = await supabase
        .from('help_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', profile.id);
      
      // Get completed requests by this helper
      const { count: completedCount } = await supabase
        .from('help_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', profile.id)
        .eq('status', 'completed');
      
      // Get responses by this helper
      const { count: responsesCount } = await supabase
        .from('help_responses')
        .select('*', { count: 'exact', head: true })
        .eq('helper_id', profile.id);
      
      return {
        pendingRequests: pendingCount || 0,
        assignedRequests: assignedCount || 0,
        completedRequests: completedCount || 0,
        totalResponses: responsesCount || 0
      };
    },
    enabled: !!profile?.id
  });

  const { data: urgentRequests } = useQuery({
    queryKey: ['urgent-requests'],
    queryFn: async () => {
      const { data } = await supabase
        .from('help_requests')
        .select(`
          *,
          profiles!help_requests_farmer_id_fkey (full_name, village, district, state)
        `)
        .eq('status', 'pending')
        .in('urgency', ['high', 'critical'])
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const { data: recentRequests } = useQuery({
    queryKey: ['recent-requests'],
    queryFn: async () => {
      const { data } = await supabase
        .from('help_requests')
        .select(`
          *,
          profiles!help_requests_farmer_id_fkey (full_name, village, district, state)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    }
  });

  const { data: myAssignedRequests } = useQuery({
    queryKey: ['my-assigned-requests', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('help_requests')
        .select(`
          *,
          profiles!help_requests_farmer_id_fkey (full_name, village, district, state)
        `)
        .eq('assigned_to', profile.id)
        .in('status', ['assigned', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
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

  if (profile?.role !== 'ngo' && profile?.role !== 'donor') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">This dashboard is only available for NGOs and donors.</p>
            <Link to="/dashboard">
              <Button>Go to Main Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            NGO Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Help farmers in need and track your impact in the community.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting assistance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Active Cases</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.assignedRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Currently helping</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully helped</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
              <p className="text-xs text-muted-foreground">Offers made</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Urgent Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                Urgent Requests
              </CardTitle>
              <CardDescription>
                High priority cases requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {urgentRequests && urgentRequests.length > 0 ? (
                urgentRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg bg-red-50 border-red-200">
                    <h3 className="font-semibold">{request.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {request.description.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="mr-1 h-3 w-3" />
                          {request.location?.district}
                        </div>
                      </div>
                      <Link to={`/help-requests/${request.id}`}>
                        <Button size="sm">Help Now</Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No urgent requests at the moment</p>
              )}
            </CardContent>
          </Card>

          {/* My Active Cases */}
          <Card>
            <CardHeader>
              <CardTitle>My Active Cases</CardTitle>
              <CardDescription>
                Requests you are currently helping with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myAssignedRequests && myAssignedRequests.length > 0 ? (
                myAssignedRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{request.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Farmer: {request.profiles?.full_name}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-1 h-3 w-3" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Link to={`/help-requests/${request.id}`}>
                        <Button size="sm" variant="outline">Update</Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No active cases</p>
              )}
              <Link to="/help-requests">
                <Button variant="outline" className="w-full">
                  View All My Cases
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Help Requests</CardTitle>
            <CardDescription>
              Latest requests from farmers in need of assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentRequests && recentRequests.length > 0 ? (
                recentRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{request.title}</h3>
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {request.urgency}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {request.description.substring(0, 80)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="mr-1 h-3 w-3" />
                        {request.location?.village}, {request.location?.district}
                      </div>
                      <Link to={`/help-requests/${request.id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-gray-500">No recent requests available</p>
                </div>
              )}
            </div>
            <div className="mt-6 text-center">
              <Link to="/help-requests">
                <Button variant="outline">
                  View All Requests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NGODashboard;
