import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import ArticleForm from "@/components/admin/ArticleForm";
import FetchArticles from "@/components/admin/FetchArticles";
import { GoogleSearch } from "@/components/GoogleSearch";

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
              variant="destructive" 
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="aspect-video w-full rounded-lg overflow-hidden bg-secondary/50 backdrop-blur-sm">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/Ks0Rj2-W-q4"
            title="Chasing Roo Video Series"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        <GoogleSearch />
        <FetchArticles />
        <ArticleForm />
      </div>
    </div>
  );
};

export default Admin;