import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vazhikatti SaaS",
  description: "Hospital Navigation Backend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* You can add custom meta tags or fonts here */}
      </head>
      <body className="antialiased">
        {/* If you have a Navbar or Provider, wrap children here */}
        <main>{children}</main>
      </body>
    </html>
  );
}
