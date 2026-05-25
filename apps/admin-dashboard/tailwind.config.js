/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'salex': {
          // ── Backgrounds ──────────────────────────────
          'black':           '#FCFCFA',   // Warm paper – main background
          'black-light':     '#FFFFFF',   // Pure white – cards / sidebar
          'black-lighter':   '#F5F3F1',   // Hovered / selected surface
          'black-lightest':  '#EEEDEC',   // Pressed surface

          // ── Brand ────────────────────────────────────
          'green':           '#12A36D',   // Premium calm success green
          'green-dark':      '#0E8558',   // Pressed green
          'green-light':     'rgba(18, 163, 109, 0.12)', // Tint bg

          // ── Semantic ──────────────────────────────────
          'blue':            '#0088CC',   // Info blue
          'blue-light':      'rgba(0, 136, 204, 0.12)',
          'amber':           '#9C7A4A',   // Antique gold warning
          'amber-light':     'rgba(156, 122, 74, 0.12)',
          'red':             '#C62020',   // Crimson error
          'red-light':       'rgba(198, 32, 32, 0.12)',

          // ── Neutrals ──────────────────────────────────
          'gray':            '#6F6D7A',   // Secondary text
          'gray-dark':       '#A8A6B0',   // Muted text / placeholders
          'gray-darker':     '#C9C7CF',   // Disabled / borders
          'gray-border':     '#C9C7CF',   // Default border
          'gray-variant':    '#F5F3F1',   // Surface variant

          // ── Text (semantic) ───────────────────────────
          'white':           '#03031F',   // Primary text (deep ink)
          'secondary':       '#6F6D7A',   // Secondary text
        },
      },

      fontFamily: {
        serif:  ['"Instrument Serif"', 'serif'],
        sans:   ['Inter', 'sans-serif'],
        mono:   ['"Space Mono"', 'monospace'],
      },

      fontSize: {
        'salex-xs':   ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        'salex-sm':   ['13px', { lineHeight: '18px' }],
        'salex-base': ['15px', { lineHeight: '22px' }],
        'salex-lg':   ['18px', { lineHeight: '26px' }],
        'salex-xl':   ['24px', { lineHeight: '32px' }],
        'salex-2xl':  ['30px', { lineHeight: '38px', letterSpacing: '-0.02em' }],
        'salex-3xl':  ['38px', { lineHeight: '46px', letterSpacing: '-0.03em' }],
      },

      fontWeight: {
        'salex-normal': '400',
        'salex-medium': '500',
        'salex-semibold': '600',
        'salex-bold':   '700',
      },

      borderRadius: {
        'salex-xs': '6px',
        'salex-sm': '8px',
        'salex-md': '10px',
        'salex-lg': '14px',
        'salex-xl': '20px',
        'salex-pill': '999px',
      },

      spacing: {
        'salex-xs':  '4px',
        'salex-sm':  '8px',
        'salex-md':  '12px',
        'salex-lg':  '16px',
        'salex-xl':  '24px',
        'salex-xxl': '32px',
        'salex-3xl': '48px',
      },

      boxShadow: {
        'salex-xs':  '0 1px 2px rgba(3, 3, 31, 0.05)',
        'salex-sm':  '0 1px 4px rgba(3, 3, 31, 0.07)',
        'salex-md':  '0 2px 8px rgba(3, 3, 31, 0.08)',
        'salex-lg':  '0 4px 16px rgba(3, 3, 31, 0.10)',
        'salex-xl':  '0 8px 32px rgba(3, 3, 31, 0.12)',
        'salex-modal': '0 20px 60px rgba(3, 3, 31, 0.18)',
        'salex-focus': '0 0 0 3px rgba(3, 3, 31, 0.10)',
      },

      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },

      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },

      animation: {
        'fade-in':      'fadeIn 0.25s ease forwards',
        'scale-in':     'scaleIn 0.2s ease forwards',
        'slide-in':     'slideInLeft 0.3s ease forwards',
      },
    },
  },
  plugins: [],
};
