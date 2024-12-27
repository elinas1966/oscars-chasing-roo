import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [selectedLanguage, setSelectedLanguage] = useState("all");

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
              <Card key={article.id} className="article-card">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="text-primary border-primary">
                    {article.language}
                  </Badge>
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