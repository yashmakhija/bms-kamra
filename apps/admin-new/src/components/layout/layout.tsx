import { Outlet } from "react-router-dom";
import { Navbar } from "./navbar/navbar";
import { Footer } from "../layout/footer";

export function Layout() {
  return (
    <div className="flex mt-10 min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
 