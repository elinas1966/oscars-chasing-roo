
import { format, parseISO } from "date-fns";

export interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  language: string;
  approved?: boolean;
}

export const formatSource = (source: string): string => {
  return source.replace(/^www\./i, '');
};

export const groupArticlesBySourceAndDate = (articles: Article[]) => {
  // First group by source, removing www. prefix and deduplicating
  const groupedBySource = articles.reduce((acc, article) => {
    const formattedSource = formatSource(article.source);
    if (!acc[formattedSource]) {
      acc[formattedSource] = [];
    }
    acc[formattedSource].push({
      ...article,
      source: formattedSource // Update the source in the article object
    });
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
  try {
    // Ensure we're working with a proper ISO date string by parsing it first
    const parsedDate = parseISO(date);
    return format(parsedDate, "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return date; // Return the original string if formatting fails
  }
};
