/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          50: "#eff2ff",
          100: "#dbe3ff",
          200: "#b7c5ff",
          300: "#8da3ff",
          400: "#5a7dff",
          500: "#3155ff",
          600: "#2043d8",
          700: "#1c39b0",
          800: "#1a3086",
          900: "#172c6d",
        },
      },
    },
  },
};
