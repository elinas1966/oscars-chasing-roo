import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, X, Check } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  language: string;
}

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
              <Card key={i} className="article-card">
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
        
        <div className="grid gap-6 md:grid-cols-2">
          {articles && articles.length > 0 ? (
            articles.map((article) => (
              <Card key={article.id} className="article-card p-6">
                {editingArticle === article.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Summary</label>
                      <Textarea
                        value={editForm.summary}
                        onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Source</label>
                      <Input
                        value={editForm.source}
                        onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">URL</label>
                      <Input
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Language</label>
                      <select
                        value={editForm.language}
                        onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                        className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                      >
                        <option value="EN">English</option>
                        <option value="ES">Spanish</option>
                        <option value="FR">French</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSaveEdit(article.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="text-primary border-primary">
                          {article.language}
                        </Badge>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(article)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteArticle.mutate(article.id)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">
                        {format(new Date(article.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <h3 className="text-xl font-serif mb-3">{article.title}</h3>
                    <p className="text-gray-400 mb-4">{article.summary}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{article.source}</span>
                      <a 
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        Read More →
                      </a>
                    </div>
                  </>
                )}
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-gray-400">No articles found for the selected language.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};