const links = [
  { href: "/contact", label: "Contact Us" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refunds & Cancellation Policy" },
] as const;

export function QuickLinks() {
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
