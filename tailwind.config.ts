import type { Config } from "tailwindcss";

// Tailwind v4 does not expose every color as a CSS variable by default.
// This keeps animation utilities like the aurora background easy to theme.

function flattenThemeColors(
  colors: unknown,
  prefix = "",
): Record<string, string> {
  if (!colors || typeof colors !== "object") {
    return {};
  }

  return Object.entries(colors as Record<string, unknown>).reduce<
    Record<string, string>
  >((acc, [key, value]) => {
    const nextKey = key === "DEFAULT" ? prefix : prefix ? `${prefix}-${key}` : key;

    if (typeof value === "string") {
      if (nextKey) {
        acc[nextKey] = value;
      }
      return acc;
    }

    Object.assign(acc, flattenThemeColors(value, nextKey));
    return acc;
  }, {});
}

function addVariablesForColors({
  addBase,
  theme,
}: {
  addBase: (base: Record<string, Record<string, string>>) => void;
  theme: (path: string) => unknown;
}) {
  const allColors = flattenThemeColors(theme("colors"));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, value]) => [`--${key}`, String(value)]),
  );

  addBase({
    ":root": newVars,
  });
}

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
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
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 1s ease forwards",
        float: "float 20s ease-in-out infinite",
        "hero-bg-fade": "hero-bg-fade 1s ease 0.2s forwards",
        "showcase-fade": "showcase-fade 0.5s ease forwards",
        aurora: "aurora 60s linear infinite",
      },
    },
  },
  plugins: [addVariablesForColors],
};

export default config;
