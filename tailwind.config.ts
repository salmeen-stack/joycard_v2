import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0F172A', 800: '#1E293B', 700: '#334155', 600: '#475569' },
        gold: { DEFAULT: '#D4AF37', light: '#E8CC6A', dark: '#A8891C' },
        teal: { DEFAULT: '#2DD4BF', light: '#5EEAD4', dark: '#0F9488' },
        cream: '#F8FAFC',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
