/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../..//src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  prefix: 'ez-',
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}

