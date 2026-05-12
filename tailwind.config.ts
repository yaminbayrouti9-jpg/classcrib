import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"], [data-theme="midnight"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-light": "var(--primary-light)",
        "primary-dark": "var(--primary-dark)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card-bg)",
        "card-border": "var(--card-border)",
        "card-hover": "var(--card-hover)",
        sidebar: "var(--sidebar-bg)",
        "sidebar-border": "var(--sidebar-border)",
        "sidebar-hover": "var(--sidebar-hover)",
        "sidebar-text": "var(--sidebar-text)",
        "sidebar-active": "var(--sidebar-text-active)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "academy-navy": "#0f172a",
        "academy-gold": "#fbbf24",
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(157, 141, 241, 0.08)",
        premium: "0 20px 50px rgba(157, 141, 241, 0.12)",
      },
      animation: {
        "bounce-slow": "bounce 3s infinite",
        "fade-in": "fadeIn 0.5s ease forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
