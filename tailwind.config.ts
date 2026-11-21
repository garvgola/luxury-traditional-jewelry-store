import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        burgundy: { 900: "#3B101B", 800: "#541A2A" },
        gold: { 600: "#A98545" },
        champagne: { 100: "#F4EBDD" },
        ivory: { 50: "#FBF8F2" },
        earth: { 700: "#66584C" },
        ink: { 900: "#211D1A" },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;