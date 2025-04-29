"use client";

import { useEffect } from "react";
import { cn } from "@repo/ui/utils";
import { ArrowUpRight } from "lucide-react";
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
    <div className="group cursor-pointer bg-[#1D1D1D] rounded-[32px] w-full lg:w-[611.74px] p-6 flex flex-col gap-6">
      {/* Title */}
      <h3 className="text-2xl text-white font-medium leading-loose">
        {article.title}
        <p className="text-sm font-medium leading-tight text-[#f1f1f1]">
          {article.date}
        </p>
      </h3>

      {/* Description */}
      <p className="self-stretch justify-center text-[#f1f1f1]/50 text-base font-normal leading-snug">
        {article.excerpt}
      </p>

      {/* Arrow Button */}
      <div className="self-end mt-auto">
        <div className="bg-[#F2F900] w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F2F900]/90 transition-colors">
          <ArrowUpRight className="w-7 h-7 text-black" />
        </div>
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
    <section className={cn("w-full py-8 md:py-12 bg-[#111111]", className)}>
      <div className="container mx-auto px-4 md:px-8 lg:px-30">
        <div className="flex justify-between items-center mb-8 md:mb-12">
          <div className="text-[#F2F900] text-3xl md:text-[40px] font-bold">
            Articles
          </div>

          <div className="hidden md:block">
            <Button className="bg-white hover:bg-white/90 text-black text-sm font-medium rounded-full px-6 h-10">
              Browse all
            </Button>
          </div>

          <div className="md:hidden">
            <Button className="bg-white hover:bg-white/90 text-black rounded-full w-10 h-10 p-0 flex items-center justify-center">
              <ArrowUpRight size={18} />
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
          <div className="bg-[#1D1D1D] rounded-[32px] p-6 text-center text-red-500">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex justify-center lg:justify-start"
              >
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
