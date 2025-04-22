// Article interface
export interface Article {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  url: string;
}

// Sample articles data
export const articles: Article[] = [
  {
    id: "1",
    title: "A really interesting title",
    date: "12/04/2025",
    excerpt:
      "Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin.",
    url: "/blog/article-1",
  },
  {
    id: "2",
    title: "A really interesting title",
    date: "12/04/2025",
    excerpt:
      "Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin.",
    url: "/blog/article-2",
  },
  {
    id: "3",
    title: "A really interesting title",
    date: "12/04/2025",
    excerpt:
      "Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin.",
    url: "/blog/article-3",
  },
  {
    id: "4",
    title: "A really interesting title",
    date: "12/04/2025",
    excerpt:
      "Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin. Lorem ipsum sit dolor amet epsin.",
    url: "/blog/article-4",
  },
];
