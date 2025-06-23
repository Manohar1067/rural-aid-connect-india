
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link to="/">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Button>
            </Link>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Link to="/schemes">
                <Button variant="outline">Browse Schemes</Button>
              </Link>
              <Link to="/help-requests">
                <Button variant="outline">Help Requests</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
