import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bloomberg-terminal inspired palette
        dead: {
          bg: '#0a0a0a',
          surface: '#111111',
          border: '#1a1a1a',
          muted: '#333333',
          text: '#e0e0e0',
          dim: '#666666',
          accent: '#ff6600',    // Warning orange
          danger: '#ff2222',    // Alert red
          safe: '#00cc66',      // Human green
          bot: '#ff4444',       // Bot red
          ai: '#ffaa00',        // AI amber
          glow: '#ff660033',    // Accent glow
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Consolas', 'monospace'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'ticker': 'ticker 30s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #ff660033' },
          '100%': { boxShadow: '0 0 20px #ff660066' },
        },
      },
    },
  },
  plugins: [],
}
export default config
