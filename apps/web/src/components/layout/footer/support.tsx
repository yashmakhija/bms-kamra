const links = [
  { href: "/contact", label: "Contact Us" },
  { href: "/terms", label: "Help" },
  { href: "/privacy", label: "FAQ" },
] as const;

export function Support() {
  return (
    <div className="space-y-6 ">
      <h3 className="text-white text-lg font-medium">Support</h3>
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
