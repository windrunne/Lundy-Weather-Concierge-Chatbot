/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Manrope'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(56, 189, 248, 0.25)",
      },
    },
  },
  plugins: [],
};

