/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // straight from the figma redesign, not the tailwind default palette
      colors: {
        pokedex: {
          bg: '#9dceff',
          border: '#7db4eb',
          card: '#bfdfff',
          cardBorder: '#003f7f',
          sprite: '#fec305',
          spriteBorder: '#0f380f',
          ink: '#102f4f',
          statBg: '#002851',
          statFilled: '#bfdfff',
          statEmpty: '#1f4469',
          panel: '#93c9fe',
          levelText: '#1c4c7d',
        },
      },
      fontFamily: {
        pixel: ['PressStart2P_400Regular'],
        dotgothic: ['DotGothic16_400Regular'],
        outfit: ['Outfit_400Regular'],
        'outfit-medium': ['Outfit_500Medium'],
        'outfit-semibold': ['Outfit_600SemiBold'],
      },
    },
  },
  plugins: [],
};
