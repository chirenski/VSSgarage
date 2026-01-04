import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        vss: {
          bg: "#0b0f14",
          panel: "rgba(255,255,255,0.06)",
          panel2: "rgba(255,255,255,0.035)",
          border: "rgba(255,255,255,0.10)",
          text: "#e7eaf0",
          muted: "#a9b0bb",
          orange: "#ff8c00"
        }
      }
    }
  },
  plugins: []
};

export default config;
