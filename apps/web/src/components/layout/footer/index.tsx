import { Brand } from "./brand";
import { Legal } from "./legal";
import { Navigate } from "./navigate";
import { SocialLinks } from "./social-links";
import { Support } from "./support";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-neutral-800 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Brand />
            <div className="flex items-center mt-4 gap-4">
              <SocialLinks />
            </div>
          </div>
          <div className="md:pl-12 grid grid-cols-1 md:grid-cols-3 gap-12">
            <Navigate />
            <Support />
            <Legal />
          </div>
        </div>
        <div className="w-full border-t border-neutral-700 my-6"></div>
        <div className="pt-2 border-t border-neutral-800">
          <p className="text-neutral-300 text-sm font-normal leading-none">
            © {currentYear} Kunal Kamra. All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

export * from "./brand";
export * from "./navigate";
export * from "./social-links";
