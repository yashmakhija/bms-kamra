import { Brand } from "./brand";
import { Legal } from "./legal";
import { Navigate } from "./navigate";
import { SocialLinks } from "./social-links";
import { Support } from "./support";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full">
      <div className="w-full bg-neutral-800 px-4 py-16">
        <div className="container mx-auto">
          {/* Mobile and Tablet View */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <Brand />

            <div className="mt-4 mb-12">
              <SocialLinks />
            </div>

            <div className="w-full grid grid-cols-1 gap-10">
              <Navigate />
              <Legal />
              <Support />
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <Brand />

              <div className="flex items-center mt-4 gap-4">
                <SocialLinks />
              </div>
            </div>
            <div className="lg:pl-12 grid grid-cols-3 gap-12">
              <Navigate />
              <Legal />
              <Support />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full py-4 bg-[#f2f900] border-t border-[#1d1d1d] flex justify-center items-center">
        <p className="justify-start text-[#1d1d1d] text-sm font-normal leading-none">
          © {currentYear} Kunal Kamra. All Rights Reserved
        </p>
      </div>
    </footer>
  );
}

export * from "./brand";
export * from "./navigate";
export * from "./social-links";
