/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./newweb/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#FDF8E8",
          100: "#F6EBC0",
          200: "#EDD683",
          300: "#E1BE48",
          400: "#D6A92F",
          500: "#C4961C",
          600: "#AB7F14",
          700: "#876311",
          800: "#62480D",
          900: "#412F08",
        },
        ink: {
          DEFAULT: "#F7EBCB",
          soft: "#E6D6A0",
          mute: "#BAA36A",
          faint: "#7E6B3E",
        },
        canvas: "#080604",
        line: "#2B2012",
        success: "#0E9F6E",
        warn: "#B54708",
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,12,20,0.04), 0 1px 3px rgba(12,12,20,0.04)",
        pop: "0 8px 30px rgba(12,12,20,0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};
