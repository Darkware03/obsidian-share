/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        surface2: 'var(--color-surface2)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.primary'),
            a: {
              color: theme('colors.accent'),
              '&:hover': {
                color: '#818cf8',
              },
            },
            h1: { color: theme('colors.primary') },
            h2: { color: theme('colors.primary') },
            h3: { color: theme('colors.primary') },
            h4: { color: theme('colors.primary') },
            strong: { color: theme('colors.primary') },
            code: { color: theme('colors.primary') },
            blockquote: {
              color: theme('colors.secondary'),
              borderLeftColor: theme('colors.surface2'),
            },
          },
        },
      }),
    },
  },
  plugins: [],
}
