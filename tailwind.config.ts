import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Laranja extraído do logotipo PSI Energy (gradiente ~#F58220 → #FDB03A)
        brand: {
          50: "#FFF6EB",
          100: "#FFE9CF",
          200: "#FFD09B",
          300: "#FFB35F",
          400: "#FDA030",
          500: "#F7901E",
          600: "#E8780C",
          700: "#C25E0A",
          800: "#9A4A0F",
          900: "#7C3E10",
        },
        // Grafite do texto "PSI ENERGY"
        graphite: {
          50: "#F6F5F5",
          100: "#EAE8E8",
          200: "#D3CFCF",
          400: "#8B8584",
          600: "#5E5958",
          700: "#4A4645",
          800: "#363332",
          900: "#232120",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(35,33,32,.06), 0 8px 24px rgba(35,33,32,.08)",
      },
    },
  },
  plugins: [],
};

export default config;
