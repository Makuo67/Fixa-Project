/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      'primary': '#00A1DE',
      'gradient-primary': '#003246',
      'secondary': '#F2FAFD',
      'tertiary': '#DEFEFF',
      'gray-1': '#676767',
      'gray-2': '#383838',
      'white': '#FFFFFF',
      'black': '#000000',
      'green-1': '#08AD36',
      'title': '#545454',
      'sub-title': '#676767',
      'bder-color': '#8692A6',
      'bder-red': '#F5222D',
      'green-2': '#52C41A',
      'mtn': '#DCB903',
      'airtel': '#FF7051',
      'bk': '#0500EC',
      'imb': '#00DEDE',
      'ecob': '#3870FF',
      'pastel':'#E4EEF3',
      'charcoal': '#1C2123',
      'gray-slate': '#757C8A',
      'formBg': '#DFF3FB',
      'profileButtonBorder': '#A8BEC5',
      'wallet_processing_text': '#9D7100',
      'wallet_processing_bg': '#FFE5A0',
      'wallet_loaded_text': '#389E0D',
      'wallet_loaded_bg': '#D9F7BE',
      'wallet_initiated_bg': '#FFD6E7',
      'pending-bg': "#FFF1B8",
      'pending-text': "#FA8C16"
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('tailwindcss-animated'),
    require('tailwind-scrollbar-hide'),
    require('@tailwindcss/typography'),
  ],
}
