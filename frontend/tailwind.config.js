/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter_400Regular'],
      },
      colors: {
        background: "#020617", // Deep Space Navy
        surface: "#1e293b",    // Dark Slate
        foreground: "#f8fafc", // Slate 50
        primary: "#06b6d4",    // Neon Cyan
        secondary: "#8b5cf6",  // Neon Violet
        accent: "#db2777",     // Hot Pink
        success: "#22c55e",
        error: "#ef4444",

        // Void Theme additions
        void: {
          DEFAULT: '#05050A',
          surface: '#060514ff',
          highlight: '#1E1E2A',
        },
        text: {
          main: '#EDEDF2',
          muted: '#8F90A6',
        },
        neon: {
          primary: '#7F00FF',
          secondary: '#00D4FF',
          accent: '#FF0055',
          success: '#00FF9D',
        }
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #7F00FF 0%, #00D4FF 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF0055 0%, #7F00FF 100%)',
        'gradient-glow': 'radial-gradient(circle at center, rgba(127, 0, 255, 0.15) 0%, rgba(5, 5, 10, 0) 70%)',
      },
      boxShadow: {
        'neon-primary': '0 0 20px -5px rgba(127, 0, 255, 0.5), 0 0 10px -2px rgba(127, 0, 255, 0.3)',
        'neon-secondary': '0 0 20px -5px rgba(0, 212, 255, 0.5), 0 0 10px -2px rgba(0, 212, 255, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}