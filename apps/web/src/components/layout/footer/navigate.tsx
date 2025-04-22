const links = [
  { href: "/contact", label: "Home" },
  { href: "/contact", label: "Gallery" },
  { href: "/contact", label: "Upcoming Shows" },
  { href: "/privacy", label: "Podcasts" },
  { href: "/refunds", label: "Articles" },
] as const;

export function Navigate() {
  return (
    <div className="space-y-6 ">
      <h3 className="text-white text-lg font-medium">Quick Links</h3>
      <nav className="space-y-4">
        {links.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="block text-[#A1A1AA] hover:text-white transition-colors text-base"
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
