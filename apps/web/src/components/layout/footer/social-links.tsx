import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const socialLinks = [
  {
    icon: Facebook,
    href: "https://facebook.com/KunalKamraIndia",
    label: "Facebook",
    color: "#1877F2",
  },
  {
    icon: Twitter,
    href: "https://x.com/kunalkamra88",
    label: "Twitter",
    color: "#1DA1F2",
  },
  {
    icon: Youtube,
    href: "https://youtube.com/@KunalKamra",
    label: "YouTube",
    color: "#FF0000",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/kuna_kamra/",
    label: "Instagram",
    color: "#E4405F",
  },
] as const;

export function SocialLinks() {
  return (
    <div className="flex items-center gap-3">
      {socialLinks.map(({ icon: Icon, href, label, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-1 transition-transform hover:scale-110"
          aria-label={label}
          style={{ color }}
        >
          <Icon size={26} strokeWidth={1.5} />
        </a>
      ))}
    </div>
  );
}
