import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { VideoSection } from "@/components/VideoSection";
import { ArticleList } from "@/components/ArticleList";
import { ScrollToTop } from "@/components/ScrollToTop";
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
      <header className="absolute top-4 right-4 z-50">
        {session ? (
          <nav className="flex gap-4">
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
          </nav>
        ) : (
          <Button 
            variant="default"
            onClick={() => navigate("/admin")}
          >
            Sign In
          </Button>
        )}
      </header>
      <Hero />
      <VideoSection />
      <ArticleList />
      <ScrollToTop />
    </main>
  );
};

export default Index;