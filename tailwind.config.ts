import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-blue": "var(--brand-blue)",
        "brand-teal": "var(--teal)",
        "brand-navy": "var(--navy)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 30px) scale(0.9)" },
        },
        "hero-bg-fade": {
          "0%": { opacity: "0" },
          "100%": { opacity: "0.15" },
        },
        "showcase-fade": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 1s ease forwards",
        float: "float 20s ease-in-out infinite",
        "hero-bg-fade": "hero-bg-fade 1s ease 0.2s forwards",
        "showcase-fade": "showcase-fade 0.5s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
