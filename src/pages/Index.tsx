import { useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { VideoSection } from "@/components/VideoSection";
import { ArticleList } from "@/components/ArticleList";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';

const Index = () => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(false);
  }, [session]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/admin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="absolute top-4 right-4 z-50">
        {session ? (
          <nav className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={handleSignOut}
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
          <div className="flex flex-col items-end gap-2">
            <Button 
              variant="default"
              onClick={() => navigate("/admin")}
            >
              Sign In
            </Button>
            <Alert variant="default" className="bg-primary/10 border-primary/20 max-w-xs">
              <AlertDescription className="text-primary text-xs">
                This site is by invitation only
              </AlertDescription>
            </Alert>
          </div>
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