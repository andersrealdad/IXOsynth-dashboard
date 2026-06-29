/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#1A1B3A',
          800: '#22234A',
          700: '#2E2F5A',
          600: '#3A3B6E',
          500: '#4A4B82',
        },
        gold: {
          DEFAULT: '#D4A853',
          dim: '#D4A85333',
          bright: '#E8C97A',
        },
        'text-primary': '#E8E6F0',
        'text-secondary': '#9B99B8',
        'text-tertiary': '#6B6988',
        'status-active': '#4ADE80',
        'status-building': '#FBBF24',
        'status-failed': '#F87171',
        'status-stale': '#9B99B8',
        'status-planned': '#60A5FA',
        group: {
          1: '#D4A853',
          2: '#5B8DB8',
          3: '#8B6F9B',
          4: '#6BA87C',
          5: '#C97A5B',
          6: '#6B8FC4',
          7: '#A89060',
          8: '#C4A040',
          9: '#7A8B9A',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        serif: ['"Source Serif Pro"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
