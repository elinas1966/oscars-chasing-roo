import { format } from "date-fns";

export interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  language: string;
}

export const groupArticlesBySourceAndDate = (articles: Article[]) => {
  // First group by source
  const groupedBySource = articles.reduce((acc, article) => {
    if (!acc[article.source]) {
      acc[article.source] = [];
    }
    acc[article.source].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  // Then sort articles within each source by date
  Object.keys(groupedBySource).forEach(source => {
    groupedBySource[source].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  return groupedBySource;
};

export const formatDate = (date: string) => {
  return format(new Date(date), "MMM d, yyyy");
};