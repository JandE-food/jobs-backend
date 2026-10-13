/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
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
      },
    },
  },
  plugins: [],
};
