import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        charcoal: {
          DEFAULT: "#0B0B0F",
          50: "#16161D",
          100: "#1C1C25",
          200: "#23232E",
          300: "#2D2D3A",
        },
        neon: {
          DEFAULT: "#C7FB4A",
          glow: "#D4FF5F",
          dim: "#8EB83A",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(199, 251, 74, 0.25)",
      },
      animation: {
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
