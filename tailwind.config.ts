import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#00854A",
          "green-deep": "#005C34",
          gold: "#F5A623",
          black: "#1A1A1A",
          mist: "#F0FDF4",
          ink: "#18211d",
        },
        surface: {
          DEFAULT: "#FAFAF8",
          card: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#6B7280",
        },
        border: {
          DEFAULT: "#E5E7EB",
        },
        success: {
          DEFAULT: "#10B981",
        },
        warning: {
          DEFAULT: "#F59E0B",
        },
        error: {
          DEFAULT: "#EF4444",
        },
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.06)",
        card: "0 2px 12px rgba(0, 0, 0, 0.05)",
        lift: "0 8px 30px rgba(0, 133, 74, 0.12)",
        warm: "0 18px 50px rgba(17, 17, 17, 0.08)",
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        body: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
