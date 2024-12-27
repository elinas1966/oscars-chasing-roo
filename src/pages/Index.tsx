import { Hero } from "@/components/Hero";
import { ArticleList } from "@/components/ArticleList";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <ArticleList />
    </main>
  );
};

export default Index;