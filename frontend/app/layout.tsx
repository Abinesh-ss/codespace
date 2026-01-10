import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Vazhikatti",
  description: "Indoor Navigation Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}

