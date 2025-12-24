module.exports = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6b5c4c',
          dark: '#4a3f35',
        },
        accent: '#a89076',
        cream: '#faf9f7',
        'warm-gray': '#7a7068',
        'soft-border': '#e5e0db',
        success: '#5c7c5f',
        error: '#a85454',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
};