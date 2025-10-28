import type { Config } from "tailwindcss";
import { designTokens } from "./design-tokens";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.light.primary,
        secondary: designTokens.colors.light.secondary,
        accent: designTokens.colors.light.accent,
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: [...designTokens.typography.fontFamily.sans],
        mono: [...designTokens.typography.fontFamily.mono],
      },
      fontSize: designTokens.typography.sizes,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      backdropBlur: {
        glass: "16px",
      },
      transitionDuration: {
        fast: designTokens.transitions.duration.fast,
        normal: designTokens.transitions.duration.normal,
        slow: designTokens.transitions.duration.slow,
      },
      screens: {
        tablet: designTokens.breakpoints.tablet,
        desktop: designTokens.breakpoints.desktop,
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

