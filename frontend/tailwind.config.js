/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0a1628',
        chrome: '#060e1d',
        surface: '#0d1f38',
        card: '#102236',
        border: '#1e3a5f',
        teal: '#2dd4bf',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
