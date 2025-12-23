/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        brand: {
          light: "#60a5fa",
          DEFAULT: "#2563eb",
          dark: "#1d4ed8"
        },
        accent: {
          sky: "#0ea5e9",
          emerald: "#10b981",
          rose: "#f43f5e"
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f8fafc"
        },
        slate: {
          950: "#020617"
        }
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 23, 42, 0.08)"
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out both",
        slideUp: "slideUp 0.4s ease-out both"
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0px)" }
        }
      }
    }
  },
  plugins: []
};
