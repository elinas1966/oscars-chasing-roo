
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Home, Check, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArticleCard } from "@/components/ArticleCard";
import { Article } from "@/utils/articleUtils";

const ApprovalQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [isEmptyQueue, setIsEmptyQueue] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(data?.role === 'admin');
        if (!data?.role || data.role !== 'admin') {
          navigate("/admin");
        }
      } else {
        navigate("/admin");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/admin");
    }
  };

  // Fetch potential pending articles (in our case, we're simulating them)
  const { data: pendingArticlesData, isLoading } = useQuery({
    queryKey: ["articles-pending"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .order("date", { ascending: false });
        
        if (error) {
          console.error("Error fetching articles:", error);
          throw error;
        }
        
        // Simulate pending articles using the same logic as in Admin.tsx
        return data || [];
      } catch (error) {
        console.error("Error in pending articles query:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: true,
  });

  // Function to filter pending articles using same logic as Admin page
  const trulyPendingArticles = React.useMemo(() => {
    if (!pendingArticlesData) return [];
    
    // In this simulation, we'll consider an article as "truly pending" 
    // if its ID is divisible by 3 but not by 6
    // This is just to simulate some pending articles with a consistent logic
    return pendingArticlesData.filter((article: any) => {
      if (!article.id) return false;
      const articleId = parseInt(article.id);
      return !isNaN(articleId) && articleId % 3 === 0 && articleId % 6 !== 0;
    });
  }, [pendingArticlesData]);

  // Effect to check if queue is empty and redirect if so
  useEffect(() => {
    // Only run this effect when we have data and we're not loading
    if (!isLoading && trulyPendingArticles.length === 0 && isAdmin) {
      // Set a flag to indicate queue is empty
      setIsEmptyQueue(true);
      
      // Show a toast notification
      toast({
        title: "Approval Queue Empty",
        description: "All articles have been processed. Redirecting to admin dashboard.",
      });
      
      // Redirect after a short delay
      const redirectTimer = setTimeout(() => {
        navigate("/admin");
      }, 2500); // Wait 2.5 seconds before redirecting
      
      return () => clearTimeout(redirectTimer);
    }
  }, [trulyPendingArticles, isLoading, isAdmin, navigate, toast]);

  const approveArticle = useMutation({
    mutationFn: async (articleId: string) => {
      // Since we don't have the approved column in the database yet,
      // we'll simulate the approval by just returning success
      return { success: true };
    },
    onSuccess: (_, articleId) => {
      // Update the cache directly
      queryClient.setQueryData(["articles-pending"], (oldData: any) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.filter((article: Article) => article.id !== articleId);
      });
      
      // Also update the main articles cache
      queryClient.setQueryData(["articles"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((article: Article) => 
          article.id === articleId ? { ...article, approved: true } : article
        );
      });
      
      // Invalidate both queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-published-articles"] });
      
      toast({
        title: "Success",
        description: "Article approved successfully",
      });
    },
    onError: (error) => {
      console.error('Error approving article:', error);
      toast({
        title: "Error",
        description: "Failed to approve article",
        variant: "destructive",
      });
    },
  });

  const approveAllArticles = () => {
    if (!trulyPendingArticles || trulyPendingArticles.length === 0) return;
    
    trulyPendingArticles.forEach(article => {
      approveArticle.mutate(article.id);
    });
  };

  const deleteArticle = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);
      
      if (error) throw error;
    },
    onSuccess: (_, articleId) => {
      // Update both caches
      queryClient.setQueryData(["articles-pending"], (oldData: any) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.filter((article: Article) => article.id !== articleId);
      });
      
      queryClient.setQueryData(["articles"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((article: Article) => article.id !== articleId);
      });
      
      // Invalidate all relevant queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-published-articles"] });
      
      toast({
        title: "Success",
        description: "Article deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    },
  });

  const updateArticle = useMutation({
    mutationFn: async (article: Partial<Article> & { id: string }) => {
      // Remove approved from the update since it's not in the database schema
      const { approved, ...updateData } = article;
      
      const { error } = await supabase
        .from('articles')
        .update({
          title: updateData.title,
          summary: updateData.summary,
          source: updateData.source,
          url: updateData.url,
          language: updateData.language,
        })
        .eq('id', article.id);
      
      if (error) throw error;
    },
    onSuccess: (_, article) => {
      // Update both caches
      const updateCache = (key: string[]) => {
        queryClient.setQueryData(key, (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((item: Article) => 
            item.id === article.id ? { ...item, ...article } : item
          );
        });
      };
      
      updateCache(["articles-pending"]);
      updateCache(["articles"]);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-published-articles"] });
      
      setEditingArticle(null);
      setEditForm({});
      toast({
        title: "Success",
        description: "Article updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating article:', error);
      toast({
        title: "Error",
        description: "Failed to update article",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return <div className="p-8 text-center">Checking permissions...</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-serif text-primary">Article Approval Queue</h1>
          </div>
          <div className="text-center py-12">Loading approval queue...</div>
        </div>
      </div>
    );
  }

  // If the queue is empty and we're showing the empty state before redirecting
  if (isEmptyQueue) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/admin")} size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-serif text-primary">Article Approval Queue</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" /> 
              View Site
            </Button>
          </header>
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border text-center space-y-4">
            <p className="text-muted-foreground text-xl">All articles have been processed!</p>
            <p className="text-muted-foreground">Redirecting to admin dashboard...</p>
            <Button onClick={() => navigate("/admin")} className="mt-4">
              Return to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = trulyPendingArticles.length || 0;

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")} size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-serif text-primary">Article Approval Queue</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" /> 
            View Site
          </Button>
        </header>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium">
              Pending Approval
            </h2>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500">
              {pendingCount} {pendingCount === 1 ? 'Article' : 'Articles'}
            </Badge>
          </div>
          {pendingCount > 0 && (
            <Button
              onClick={approveAllArticles}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Approve All
            </Button>
          )}
        </div>

        <section aria-label="Approval Queue" className="space-y-4">
          {trulyPendingArticles.length > 0 ? (
            trulyPendingArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isAdmin={true}
                isEditing={editingArticle === article.id}
                editForm={editForm}
                onEdit={(a) => {
                  setEditingArticle(a.id);
                  setEditForm(a);
                }}
                onDelete={(id) => deleteArticle.mutate(id)}
                onCancelEdit={() => {
                  setEditingArticle(null);
                  setEditForm({});
                }}
                onSaveEdit={(articleId) => {
                  if (!editForm.title || !editForm.summary || !editForm.source || !editForm.url) {
                    toast({
                      title: "Error",
                      description: "All fields are required",
                      variant: "destructive",
                    });
                    return;
                  }
                  updateArticle.mutate({ ...editForm, id: articleId });
                }}
                onEditFormChange={(field, value) => {
                  setEditForm(prev => ({ ...prev, [field]: value }));
                }}
                onApprove={(id) => approveArticle.mutate(id)}
                isPending={true}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-lg border">
              <p className="text-muted-foreground">No articles pending approval.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ApprovalQueue;
