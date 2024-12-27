import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  language: string;
}

const mockArticles: Article[] = [
  {
    id: "1",
    title: "Oscar® Shortlists in 10 Award Categories Announced",
    summary: "The Academy of Motion Picture Arts and Sciences announced shortlists in 10 categories for the 96th Academy Awards®, including 'Chasing Roo' in Documentary Short Film.",
    source: "Oscars.org",
    url: "https://press.oscars.org/news/97th-oscarsr-shortlists-10-award-categories-announced",
    date: "2023-12-21",
    language: "EN"
  },
  {
    id: "2",
    title: "Chasing Roo - Awards & Recognition",
    summary: "Documentary short film exploring unique stories, nominated for prestigious awards.",
    source: "IMDb",
    url: "https://www.imdb.com/title/tt35052005/",
    date: "2024-01-15",
    language: "EN"
  }
];

export const ArticleList = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  const filteredArticles = selectedLanguage === "all" 
    ? mockArticles 
    : mockArticles.filter(article => article.language === selectedLanguage);

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
          {filteredArticles.map((article) => (
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
          ))}
        </div>
      </div>
    </section>
  );
};