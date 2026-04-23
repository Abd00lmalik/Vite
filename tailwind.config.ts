import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        who: {
          blue:        '#005EB8',
          'blue-dark': '#004A99',
          'blue-light':'#E8F2FB',
          orange:      '#F37021',
          'orange-light': '#FEF3EC',
          green:       '#009900',
          'green-light': '#E6F5E6',
          red:         '#CC0000',
          'red-light':  '#FDECEA',
        },
        ui: {
          bg:          '#F7F9FC',
          white:       '#FFFFFF',
          border:      '#E0E0E0',
          'border-dark': '#C0C0C0',
          text:        '#333333',
          'text-light':'#666666',
          'text-muted':'#999999',
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
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.04)',
        panel: '0 2px 8px 0 rgba(0,0,0,0.08)',
        modal: '0 8px 32px 0 rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
};

export default config;



