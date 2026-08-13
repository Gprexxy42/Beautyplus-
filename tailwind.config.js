/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: 'var(--bg-base, #1B1712)',
          card: 'var(--bg-card, #2A241D)',
          hover: 'var(--bg-hover, #362E25)',
          border: 'var(--bg-border, #42392E)'
        },
        harmattan: {
          DEFAULT: '#C9A227',
          light: '#E5BF42',
        },
        rain: {
          DEFAULT: '#60A5FA', /* Lighter blue to pop against dark bg */
          light: '#93C5FD',
        },
        bone: {
          DEFAULT: '#EDE7DA',
          muted: '#A89F91',
          dark: '#736B5E'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        scan: {
          '0%, 100%': { top: '5%' },
          '50%': { top: '95%' },
        }
      },
      animation: {
        'scan': 'scan 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
