import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ArticleCard } from "./ArticleCard";
import { Article, groupArticlesBySourceAndDate } from "@/utils/articleUtils";

export const ArticleList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Article>>({});

  // Check if user is admin
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
    queryKey: ["articles", selectedLanguage],
    queryFn: async () => {
      let query = supabase.from("articles").select("*");
      
      if (selectedLanguage !== "all") {
        query = query.eq("language", selectedLanguage);
      }
      
      const { data, error } = await query.order("date", { ascending: false });
      
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
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="article-card p-6">
                <Skeleton className="h-4 w-20 mb-4" />
                <Skeleton className="h-6 w-full mb-3" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const groupedArticles = articles ? groupArticlesBySourceAndDate(articles) : {};

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-serif text-3xl text-primary">Latest Coverage</h2>
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-secondary text-white border border-gray-700 rounded-md px-4 py-2"
          >
            <option value="all">All Languages</option>
            <option value="EN">English</option>
            <option value="ES">Spanish</option>
            <option value="FR">French</option>
          </select>
        </div>
        
        <div className="space-y-12">
          {Object.entries(groupedArticles).map(([source, sourceArticles]) => (
            <div key={source} className="space-y-6">
              <h3 className="text-2xl font-serif text-primary/80 border-b pb-2">
                {source}
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
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
    </section>
  );
};