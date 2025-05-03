
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import ArticleForm from "@/components/admin/ArticleForm";
import FetchArticles from "@/components/admin/FetchArticles";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError } from "@supabase/supabase-js";
import { Home, FilePlus, FileText, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Article } from "@/utils/articleUtils";

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const [showArticleForm, setShowArticleForm] = useState(false);

  // Add query to fetch all published articles to compare against pending
  const { data: publishedArticles } = useQuery({
    queryKey: ["admin-published-articles"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*");
        
        if (error) {
          console.error("Error fetching published articles:", error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.error("Error in published articles query:", error);
        return [];
      }
    },
    refetchInterval: 60000, // Refresh every minute
    enabled: !!isAdmin,
  });

  // Add query to fetch pending articles
  const { data: pendingArticles } = useQuery({
    queryKey: ["admin-pending-articles"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("pending_articles") // This should be your actual pending articles table
          .select("*");
        
        if (error) {
          console.error("Error fetching pending articles:", error);
          // If there's an error (like table doesn't exist yet), fallback to simulated data
          const publishedData = await supabase.from("articles").select("*");
          // Simulate pending articles for demonstration
          return publishedData.data?.filter((_, index) => index % 3 === 0) || [];
        }
        
        return data || [];
      } catch (error) {
        console.error("Error in pending articles query:", error);
        return [];
      }
    },
    refetchInterval: 60000, // Refresh every minute
    enabled: !!isAdmin,
  });

  // Filter out pending articles that are already published
  const trulyPendingArticles = React.useMemo(() => {
    if (!pendingArticles || !publishedArticles) return [];
    
    // Get IDs of all published articles
    const publishedIds = new Set(
      publishedArticles.map((article: Article) => article.id)
    );
    
    // Filter pending articles that are not in the published set
    return pendingArticles.filter((article: Article) => 
      !publishedIds.has(article.id)
    );
  }, [pendingArticles, publishedArticles]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        checkAdminStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user?.id) {
        checkAdminStatus(session.user.id);
      }
      // Handle auth errors and clear them on sign out
      if (event === 'SIGNED_OUT') {
        setAuthError("");
      }
      if (event === 'USER_UPDATED') {
        const { error } = await supabase.auth.getSession();
        if (error) {
          handleAuthError(error);
        }
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

  const handleAuthError = (error: AuthError) => {
    if (error.message.includes("email_provider_disabled")) {
      setAuthError("Email authentication is currently disabled. Please contact the administrator.");
    } else if (error.message.includes("weak_password")) {
      setAuthError("Password must be at least 6 characters long.");
    } else if (error.message.includes("invalid_credentials")) {
      setAuthError("Invalid email or password.");
    } else {
      setAuthError(error.message);
    }
  };

  const pendingCount = trulyPendingArticles?.length || 0;

  if (!session) {
    return (
      <main className="max-w-md mx-auto mt-10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <Button variant="ghost" onClick={() => navigate("/")} size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </div>
        {authError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}
        <Auth 
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'rgb(var(--primary))',
                  brandAccent: 'rgb(var(--primary))',
                }
              }
            },
            className: {
              anchor: 'hidden',
              container: 'auth-container',
              divider: 'hidden',
            },
          }}
          theme="light"
          providers={[]}
        />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="max-w-md mx-auto mt-10 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <Button variant="ghost" onClick={() => navigate("/")} size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </div>
        <p className="mb-4">You need admin privileges to access this page.</p>
        <Button onClick={() => navigate("/")}>Return to Home</Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-serif text-primary">Admin Dashboard</h1>
          <nav className="space-x-4 flex items-center">
            {pendingCount > 0 && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/approval-queue")} 
                className="flex items-center gap-2 relative"
              >
                <Bell className="h-4 w-4" />
                <span>Approval Queue</span>
                <Badge 
                  className="absolute -top-2 -right-2 bg-yellow-500 text-white"
                  variant="default"
                >
                  {pendingCount}
                </Badge>
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-2" />
              View Site
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
          </nav>
        </header>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Article Management</h2>
          <Button 
            onClick={() => setShowArticleForm(!showArticleForm)} 
            className="gap-2"
          >
            <FilePlus className="h-4 w-4" />
            {showArticleForm ? "Hide Form" : "Add New Article"}
          </Button>
        </div>

        {showArticleForm && (
          <section aria-label="New Article Form" className="bg-muted/30 p-4 rounded-lg border">
            <ArticleForm onSuccess={() => setShowArticleForm(false)} />
          </section>
        )}

        <section aria-label="Article Management">
          <FetchArticles />
        </section>
      </div>
    </main>
  );
};

export default Admin;
