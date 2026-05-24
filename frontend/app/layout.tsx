import type { ReactNode } from "react";
import MobileBlocker from "./components/MobileBlocker";
import "./globals.css";

export const metadata = {
  title: "Vazhikatti",
  description: "Indoor Navigation Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {/* We pass the pages into the blocker component */}
        <MobileBlocker>{children}</MobileBlocker>
      </body>
    </html>
  );
}
