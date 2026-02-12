import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock, LogIn, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

const AdminSignIn = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if already signed in
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      // Known admin emails - bypass profile check
      const knownAdminEmails = ['generalprep.ig@gmail.com', 'pastendro@gmail.com'];
      if (user.email && knownAdminEmails.includes(user.email.toLowerCase())) {
        setIsAdmin(true);
        navigate('/admin');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }

        if (data && data.role === 'admin') {
          setIsAdmin(true);
          navigate('/admin');
        }
      } catch (error) {
        console.error('Unexpected error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  // Auto-fill pastendro@gmail.com for convenience
  useEffect(() => {
    setEmail('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        throw error;
      }

      // Known admin emails - allow access even if profile check fails
      const knownAdminEmails = ['generalprep.ig@gmail.com', 'pastendro@gmail.com'];
      if (knownAdminEmails.includes(email.toLowerCase())) {
        toast({
          title: "Welcome back, Admin",
          description: "You have successfully signed in to the admin dashboard",
        });
        navigate("/admin");
        return;
      }

      // For other users, check if they have admin role
      if (data?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error checking admin status:', profileError);
          throw new Error('Could not verify admin privileges');
        }

        if (profileData && profileData.role === 'admin') {
          toast({
            title: "Welcome back, Admin",
            description: "You have successfully signed in to the admin dashboard",
          });
          navigate("/admin");
        } else {
          toast({
            title: "Access Denied",
            description: "You do not have admin privileges",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In to Admin
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            <span className="inline-flex items-center">
              <Lock className="h-3 w-3 mr-1" /> Secure Admin Access Only
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminSignIn;
