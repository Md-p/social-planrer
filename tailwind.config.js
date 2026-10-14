/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#043873',
          dark: '#032437',
          blue: '#4F9CF9',
          lightBlue: '#E8F2FF',
          yellow: '#FFE492',
          yellowHover: '#FFD86A',
          darkBg: '#0B1220',
          darkCard: '#151E32',
        }
      }
    },
  },
  plugins: [],
}
