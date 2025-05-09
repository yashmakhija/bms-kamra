import React from "react";

const firstRowLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com/KunalKamraIndia",
  },
  {
    name: "Twitter (X)",
    href: "https://x.com/kunalkamra88",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@KunalKamra",
  },
] as const;

const secondRowLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/kuna_kamra/",
  },
  {
    name: "Threads",
    href: "https://www.threads.net/@kuna_kamra",
  },
  {
    name: "Mail",
    href: "mailto:contact@kunalkamra.com",
  },
  {
    name: "Phone",
    href: "tel:+919999999999",
  },
] as const;

export function SocialLinks() {
  return (
    <div className="flex flex-col space-y-3">
      {/* First row - Facebook, Twitter, YouTube */}
      <div className="flex items-center gap-2.5">
        {firstRowLinks.map(({ name, href }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="outline-1 outline-offset-[-1px] outline-white/10 text-white hover:opacity-80 transition-opacity px-4 py-2 justify-center items-center rounded-3xl text-base"
            aria-label={name}
          >
            {name}
          </a>
        ))}
      </div>

      {/* Second row - Instagram, Threads, Mail, Phone */}
      <div className="flex items-center gap-2.5">
        {secondRowLinks.map(({ name, href }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="outline-1 outline-offset-[-1px] outline-white/10 text-white hover:opacity-80 transition-opacity px-4 py-2 justify-center items-center rounded-3xl text-base"
            aria-label={name}
          >
            {name}
          </a>
        ))}
      </div>
    </div>
  );
}
