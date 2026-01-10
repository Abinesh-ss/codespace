/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#020617",     // slate-950
          panel: "#020617E6", // translucent panels
          border: "rgba(255,255,255,0.08)",
          primary: "#2563eb", // blue-600
        },
      },
      zIndex: {
        map: "0",
        overlay: "10",
        ui: "20",
        modal: "50",
        toast: "100",
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
      borderRadius: {
        panel: "1.5rem",
        control: "1rem",
      },
      boxShadow: {
        panel: "0 10px 40px rgba(0,0,0,0.5)",
        glow: "0 0 40px rgba(37,99,235,0.4)",
      },
    },
  },
  plugins: [],
};

