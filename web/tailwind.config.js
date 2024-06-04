// tailwind.config.js
const {nextui} = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // ...
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{html,js}"
  ],
  theme: {
    extend: {
      backgroundImage: {
        'google-gradient': 'linear-gradient(90deg, #EA4335, #FBBC05, #34A853, #4285F4)',
      },
    }
  },
  darkMode: "class",
  plugins: [nextui()],
};