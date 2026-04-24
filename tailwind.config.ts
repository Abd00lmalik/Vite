import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          primary: '#14B8A6',
          dark: '#0F766E',
          pale: '#CCFBF1',
          50: '#F0FDFA',
          100: '#CCFBF1',
        },
        brand: {
          primary: '#3B82F6',
          'primary-dark': '#2563EB',
          secondary: '#14B8A6',
          'secondary-dark': '#0F766E',
          accent: '#38BDF8',
          bg: '#F9FAFB',
          card: '#FFFFFF',
          border: '#E5E7EB',
          heading: '#0F172A',
          text: '#334155',
          muted: '#64748B',
        },
        who: {
          blue: '#3B82F6',
          'blue-dark': '#2563EB',
          'blue-light': '#EFF6FF',
          orange: '#F59E0B',
          'orange-light': '#FEF3C7',
          green: '#14B8A6',
          'green-light': '#CCFBF1',
          red: '#EF4444',
          'red-light': '#FEE2E2',
        },
        ui: {
          bg: '#F9FAFB',
          white: '#FFFFFF',
          border: '#E5E7EB',
          'border-dark': '#CBD5E1',
          text: '#0F172A',
          'text-light': '#475569',
          'text-muted': '#64748B',
          surface: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs:   ['12px', '18px'],
        sm:   ['14px', '20px'],
        base: ['16px', '24px'],
        lg:   ['18px', '28px'],
        xl:   ['20px', '30px'],
        '2xl':['24px', '32px'],
        '3xl':['30px', '38px'],
        '4xl':['36px', '44px'],
      },
      borderRadius: {
        sm:  '4px',
        DEFAULT: '6px',
        md:  '8px',
        lg:  '12px',
        xl:  '16px',
        '2xl': '18px',
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.06)',
        panel: '0 16px 44px rgba(15, 23, 42, 0.08)',
        modal: '0 24px 60px rgba(15, 23, 42, 0.2)',
        soft: '0 8px 24px rgba(59, 130, 246, 0.12)',
      },
      backgroundImage: {
        'hero-gradient':
          'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(20,184,166,0.14) 100%)',
        'card-gradient':
          'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(20,184,166,0.08) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;



