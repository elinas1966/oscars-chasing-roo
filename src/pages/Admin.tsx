import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const Admin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    source: "",
    url: "",
    language: "EN",
  });
  const [isFetching, setIsFetching] = useState(false);

  // Check authentication and admin status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking admin status:', error);
      return;
    }
    
    setIsAdmin(data.role === 'admin');
  };

  const { mutate: addArticle, isPending } = useMutation({
    mutationFn: async (articleData: typeof formData) => {
      const { error } = await supabase.from("articles").insert([
        {
          ...articleData,
          date: new Date().toISOString().split('T')[0],
        }
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Success",
        description: "Article added successfully",
      });
      setFormData({
        title: "",
        summary: "",
        source: "",
        url: "",
        language: "EN",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add article: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addArticle(formData);
  };

  const handleFetchRelated = async () => {
    try {
      setIsFetching(true);
      const { data, error } = await supabase.functions.invoke('fetch-related-articles');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully fetched ${data.count} related articles`,
      });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    } catch (error) {
      console.error('Error fetching related articles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch related articles: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <Auth 
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="light"
          providers={[]}
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">You need admin privileges to access this page.</p>
        <Button onClick={() => navigate("/")}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif text-primary">Admin Dashboard</h1>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              View Site
            </Button>
            <Button 
              onClick={handleFetchRelated}
              disabled={isFetching}
            >
              {isFetching ? "Fetching..." : "Fetch Related Articles"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Summary</label>
              <Textarea
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <Input
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="ES">Spanish</SelectItem>
                  <SelectItem value="FR">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Article"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Admin;