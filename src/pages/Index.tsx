import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { ArticleList } from "@/components/ArticleList";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-50">
        {session ? (
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </Button>
            <Button 
              variant="default"
              onClick={() => navigate("/admin")}
            >
              Admin
            </Button>
          </div>
        ) : (
          <Button 
            variant="default"
            onClick={() => navigate("/admin")}
          >
            Sign In
          </Button>
        )}
      </div>
      <Hero />
      <ArticleList />
    </main>
  );
};

export default Index;