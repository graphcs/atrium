import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0c0e14',
          1: '#13151d',
          2: '#1a1d27',
          3: '#22252f',
        },
        border: {
          DEFAULT: '#252833',
          light: '#2f3340',
        },
        accent: {
          DEFAULT: '#5a8af2',
          hover: '#4a7ae2',
          subtle: 'rgba(90, 138, 242, 0.08)',
          border: 'rgba(90, 138, 242, 0.25)',
        },
        success: {
          DEFAULT: '#34d399',
          dim: '#10b981',
          subtle: 'rgba(52, 211, 153, 0.08)',
          border: 'rgba(52, 211, 153, 0.25)',
        },
        danger: {
          DEFAULT: '#f87171',
          dim: '#ef4444',
          subtle: 'rgba(248, 113, 113, 0.08)',
          border: 'rgba(248, 113, 113, 0.25)',
        },
        warning: {
          DEFAULT: '#fbbf24',
          dim: '#f59e0b',
          subtle: 'rgba(251, 191, 36, 0.08)',
          border: 'rgba(251, 191, 36, 0.25)',
        },
        txt: {
          1: '#e4e5ea',
          2: '#8b8d98',
          3: '#5c5e6a',
        },
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-4px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
