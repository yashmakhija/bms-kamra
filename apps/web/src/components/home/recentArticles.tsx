"use client";

import { useEffect } from "react";
import { cn } from "@repo/ui/utils";
import { ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { create } from "zustand";
import { Article, articles as mockArticles } from "../../data/articles";

// Zustand store for article state
interface ArticleState {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  fetchArticles: () => Promise<void>;
}

const useArticleStore = create<ArticleState>((set) => ({
  articles: [],
  isLoading: false,
  error: null,
  fetchArticles: async () => {
    set({ isLoading: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ articles: mockArticles, isLoading: false });
    } catch (error) {
      set({ error: "Failed to fetch articles", isLoading: false });
    }
  },
}));

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="bg-neutral-800 rounded-xl p-6 mb-6">
      <h3 className="text-xl text-white font-medium mb-1">{article.title}</h3>
      <p className="text-neutral-400 text-sm mb-3">{article.date}</p>
      <p className="text-neutral-300 text-base mb-4 line-clamp-2">
        {article.excerpt}
      </p>
      <div className="flex justify-end">
        <a
          href="#"
          className="inline-flex items-center justify-center bg-[#e31001] hover:bg-[#D00000] text-white text-sm font-medium rounded-lg px-7 py-2.5"
        >
          Read
        </a>
      </div>
    </div>
  );
}

interface RecentArticlesProps {
  className?: string;
  initialArticles?: Article[];
}

export function RecentArticles({
  className,
  initialArticles,
}: RecentArticlesProps) {
  const { articles, isLoading, error, fetchArticles } = useArticleStore();

  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      useArticleStore.setState({ articles: initialArticles });
    } else {
      fetchArticles();
    }
  }, [initialArticles, fetchArticles]);

  return (
    <section className={cn("w-full py-12 bg-[#171717]", className)}>
      <div className="container mx-auto px-4 md:px-8 lg:px-30">
        <div className="flex justify-between items-center mb-8">
          <div className="text-white text-3xl font-bold leading-10">
            Recent Articles
          </div>

          <div className="hidden md:block">
            <Button className="bg-neutral-50 cursor-pointer text-neutral-900 text-sm leading-none font-medium rounded-xl gap-2 overflow-hidden min-w-[110px] h-[40px] px-6 py-4">
              Browse all
            </Button>
          </div>

          <div className="md:hidden">
            <Button className="bg-neutral-50 text-neutral-900 rounded-xl w-12 h-12 p-0 flex items-center justify-center">
              <ArrowRight size={20} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-pulse text-neutral-400">
              Loading articles...
            </div>
          </div>
        ) : error ? (
          <div className="bg-neutral-800 rounded-xl p-6 text-center text-red-500">
            {error}
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-8xl ">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
