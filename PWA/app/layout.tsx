import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HospiNav Pro",
  description: "Advanced Hospital Indoor Navigation",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HospiNav Pro",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617", // slate-950
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="antialiased w-full h-full overflow-hidden"
    >
      <body
        className="
          w-screen
          h-screen
          m-0
          p-0
          bg-slate-950
          text-slate-100
          overflow-hidden
        "
      >
        {children}
      </body>
    </html>
  );
}

