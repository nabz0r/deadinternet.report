import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dead: {
          bg: '#0a0a0a',
          surface: '#111111',
          border: '#1a1a1a',
          muted: '#333333',
          text: '#e0e0e0',
          dim: '#666666',
          accent: '#ff6600',
          danger: '#ff2222',
          safe: '#00cc66',
          bot: '#ff4444',
          ai: '#ffaa00',
          glow: '#ff660033',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Consolas', 'monospace'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'ticker': 'ticker 30s linear infinite',
        'ticker-seamless': 'ticker-scroll 40s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'ticker-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #ff660033' },
          '100%': { boxShadow: '0 0 20px #ff660066' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
