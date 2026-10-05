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
        // Design Tokens dari design.md Bagian 3
        primary: {
          DEFAULT: "#1E8E5A",
          hover: "#166B44",
          soft: "#F0F7F3",
          active: "#0F5333",
        },
        surface: {
          DEFAULT: "#F8FAFC",
          hover: "#F1F5F9",
          raised: "#FFFFFF",
          subtle: "#FAFCFA",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
        border: {
          DEFAULT: "#E2E8F0",
          subtle: "#F1F5F9",
        },

        // Fungsional - Severity (design.md Bagian 3.2)
        severity: {
          critical: "#DC2626",
          high: "#EA580C",
          medium: "#D97706",
          low: "#1E8E5A",
        },

        // Fungsional - Status Laporan (design.md Bagian 3.3)
        status: {
          baru: "#64748B",
          diverifikasi: "#2563EB",
          dijadwalkan: "#7C3AED",
          dikerjakan: "#D97706",
          selesai: "#1E8E5A",
          ditolak: "#DC2626",
        },

        // Fungsional - Sistem Feedback (design.md Bagian 3.4)
        feedback: {
          success: "#1E8E5A",
          warning: "#D97706",
          error: "#DC2626",
          info: "#2563EB",
        },
      },
      backgroundColor: {
        base: "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem", // 12px
        lg: "0.5rem",  // 8px
        "2xl": "1rem", // 16px
        "3xl": "1.5rem", // 24px
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        "card-hover": "0 6px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)",
        float: "0 14px 28px -4px rgba(15, 23, 42, 0.10), 0 4px 10px -2px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
