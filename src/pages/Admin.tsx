import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import ArticleForm from "@/components/admin/ArticleForm";
import FetchArticles from "@/components/admin/FetchArticles";
import { GoogleSearch } from "@/components/GoogleSearch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError } from "@supabase/supabase-js";

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string>("");

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

  if (!session) {
    return (
      <main className="max-w-md mx-auto mt-10 p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
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
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
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
          <nav className="space-x-4">
            <Button variant="outline" onClick={() => navigate("/")}>
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

        <section aria-label="Search Tools">
          <GoogleSearch />
        </section>

        <section aria-label="Article Management">
          <FetchArticles />
        </section>

        <section aria-label="New Article Form">
          <ArticleForm />
        </section>
      </div>
    </main>
  );
};

export default Admin;