export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#EEEDFC',
          100: '#DEDBF9',
          200: '#BDB7F3',
          300: '#9A92EC',
          400: '#7A6FE6',
          500: '#5B4EE0',
          600: '#4338CA',
          700: '#372DA6',
          800: '#2A2280',
          900: '#1D1859',
        },
        ink: {
          DEFAULT: '#0C0C14',
          soft: '#3F4155',
          mute: '#6C6E85',
          faint: '#9A9CB0',
        },
        canvas: '#F3F4F9',
        line: '#E5E6F0',
        success: '#0E9F6E',
        warn: '#B54708',
      },
      boxShadow: {
        card: '0 1px 2px rgba(12,12,20,0.04), 0 1px 3px rgba(12,12,20,0.04)',
        pop: '0 8px 30px rgba(12,12,20,0.12)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
    },
  },
}
