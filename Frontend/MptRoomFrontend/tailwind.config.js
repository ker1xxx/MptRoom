/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss,css}",
    "./projects/**/*.{html,ts,scss,css}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        secondary: '#a78bfa',
      }
    }
  }
}

