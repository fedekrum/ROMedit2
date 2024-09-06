/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      screens: {
        'xs': '480px', // Custom breakpoint for extra small screens
      },
      fontSize: {
        'dynamic': 'clamp(0rem, 1vw*2.63, 1.05rem)', // Adjust values as needed
      },
    },
  },
  plugins: [],
}

