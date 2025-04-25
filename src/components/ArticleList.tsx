
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ArticleCard } from "./ArticleCard";
import { Article, groupArticlesBySourceAndDate } from "@/utils/articleUtils";
import { Button } from "@/components/ui/button";
import { ArrowDownAZ } from "lucide-react";

export const ArticleList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});
  const [sortAscending, setSortAscending] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [showAllArticles, setShowAllArticles] = useState(true);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setIsAdmin(data?.role === 'admin');
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles", sortAscending],
    queryFn: async () => {
      let query = supabase.from("articles").select("*");
      
      const { data, error } = await query
        .order("date", { ascending: false }) // Default sort by date descending
        .order("source", { ascending: sortAscending }); // Secondary sort by source
      
      if (error) {
        console.error("Error fetching articles:", error);
        throw error;
      }
      
      return data as Article[];
    },
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
      const { error } = await supabase
        .from('articles')
        .update({
          title: article.title,
          summary: article.summary,
          source: article.source,
          url: article.url,
          language: article.language,
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

  const handleEdit = (article: Article) => {
    setEditingArticle(article.id);
    setEditForm(article);
  };

  const handleCancelEdit = () => {
    setEditingArticle(null);
    setEditForm({});
  };

  const handleSaveEdit = (articleId: string) => {
    if (!editForm.title || !editForm.summary || !editForm.source || !editForm.url) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    updateArticle.mutate({ ...editForm, id: articleId });
  };

  const handleEditFormChange = (field: keyof Article, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex gap-8">
          <div className="w-1/4">
            <Skeleton className="h-8 w-48 mb-4" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </div>
          <div className="w-3/4">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedArticles = articles ? groupArticlesBySourceAndDate(articles) : {};
  const sources = Object.keys(groupedArticles);
  const filteredArticles = selectedSource && !showAllArticles 
    ? { [selectedSource]: groupedArticles[selectedSource] }
    : groupedArticles;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-4xl text-primary break-words max-w-[600px]">Latest Coverage</h2>
      </div>

      <div className="flex gap-8">
        <div className="w-1/4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-serif text-primary/90">Sources</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSortAscending(!sortAscending)}
                className="hover:bg-primary/10"
                title={sortAscending ? "Sort ascending" : "Sort descending"}
              >
                <ArrowDownAZ className={`text-primary ${sortAscending ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSource(null);
                setShowAllArticles(true);
              }}
            >
              Show All
            </Button>
          </div>
          <div className="space-y-2">
            {sources.map((source) => (
              <Button
                key={source}
                variant={selectedSource === source && !showAllArticles ? "secondary" : "ghost"}
                className="w-full justify-start text-left truncate"
                onClick={() => {
                  setSelectedSource(source);
                  setShowAllArticles(false);
                }}
              >
                <span className="truncate">
                  {source}
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({groupedArticles[source].length})
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="w-3/4">
          <div className="space-y-8">
            {Object.entries(filteredArticles).map(([source, sourceArticles]) => (
              <div key={source} className="space-y-4">
                <h3 className="text-2xl font-serif text-primary/90 border-b border-primary/20 pb-2 break-words">
                  {source}
                </h3>
                <div className="grid gap-4">
                  {sourceArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isAdmin={isAdmin}
                      isEditing={editingArticle === article.id}
                      editForm={editForm}
                      onEdit={handleEdit}
                      onDelete={(id) => deleteArticle.mutate(id)}
                      onCancelEdit={handleCancelEdit}
                      onSaveEdit={handleSaveEdit}
                      onEditFormChange={handleEditFormChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
