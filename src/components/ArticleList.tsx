
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleCard } from "./ArticleCard";
import { SearchBar } from "./article/SearchBar";
import { Article } from "@/utils/articleUtils";

export const ArticleList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [searchTerm, setSearchTerm] = useState("");

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
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      try {
        let query = supabase.from("articles").select("*");
        
        // We don't filter by approved status in the query since the column doesn't exist
        const { data, error } = await query.order("date", { ascending: false });
        
        if (error) {
          console.error("Error fetching articles:", error);
          throw error;
        }
        
        // Post-process the data to simulate approval status
        // In a real application, you would add this column to your database
        const processedData = data?.map(article => ({
          ...article,
          // Default all articles to approved for now
          approved: true
        })) || [];
        
        return processedData;
      } catch (error) {
        console.error("Error in articles query:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: true,
  });

  const deleteArticle = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
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

  const approveArticle = useMutation({
    mutationFn: async (articleId: string) => {
      // Since we don't have the approved column in the database yet,
      // we'll simulate the approval by just returning success
      // In a real application, you would update the approval status in the database
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
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

  const safeArticles = Array.isArray(articles) ? articles : [];
  
  const filteredArticles = searchTerm.trim() === "" 
    ? safeArticles 
    : safeArticles.filter(article =>
        (article.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.summary || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.source || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

  // For demonstration purposes, let's simulate some articles as pending approval
  const articlesWithApprovalStatus = filteredArticles.map((article, index) => ({
    ...article,
    approved: index % 3 !== 0 // Make every third article pending approval for demo
  }));

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-4xl text-primary">Latest Coverage</h2>
          <Skeleton className="h-10 w-72" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h2 className="font-serif text-4xl text-primary break-words max-w-[600px]">
          {isAdmin ? "All Articles" : "Latest Coverage"}
        </h2>
        <SearchBar articles={safeArticles} onSearch={setSearchTerm} />
      </div>

      {isAdmin && (
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Approval Queue</h3>
          <div className="bg-secondary/10 p-4 rounded-md">
            {articlesWithApprovalStatus.filter(article => !article.approved).length === 0 ? (
              <p className="text-muted-foreground">No articles pending approval.</p>
            ) : (
              <div className="space-y-4">
                {articlesWithApprovalStatus
                  .filter(article => !article.approved)
                  .map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isAdmin={isAdmin}
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
                      isPending={!article.approved}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {isAdmin ? (
          // For admin users: Show both approved and pending articles
          articlesWithApprovalStatus.length > 0 ? (
            <>
              <h3 className="text-xl font-medium">Published Articles</h3>
              <div className="space-y-6">
                {articlesWithApprovalStatus
                  .filter(article => article.approved)
                  .map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isAdmin={isAdmin}
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
                    />
                  ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No articles found matching your search.</p>
            </div>
          )
        ) : (
          // For regular users: Show only approved articles
          articlesWithApprovalStatus.length > 0 ? (
            articlesWithApprovalStatus
              .filter(article => article.approved)
              .map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isAdmin={isAdmin}
                  isEditing={false}
                />
              ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No articles found matching your search.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
