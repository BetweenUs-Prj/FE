/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Glass tints with alpha support
        'tint-primary': 'rgb(var(--tint-primary) / <alpha-value>)',
        'tint-secondary': 'rgb(var(--tint-secondary) / <alpha-value>)',
        'tint-success': 'rgb(var(--tint-success) / <alpha-value>)',
        'tint-warning': 'rgb(var(--tint-warning) / <alpha-value>)',
        'tint-danger': 'rgb(var(--tint-danger) / <alpha-value>)',
        
        // Glass backgrounds
        'bg-primary': 'rgb(var(--bg-primary) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--bg-secondary) / <alpha-value>)',
        'bg-tertiary': 'rgb(var(--bg-tertiary) / <alpha-value>)',
        'bg-quaternary': 'rgb(var(--bg-quaternary) / <alpha-value>)',
        
        // Glass surfaces
        'surface-glass': 'rgb(var(--surface-glass) / <alpha-value>)',
        'surface-overlay': 'rgb(var(--surface-overlay) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated) / <alpha-value>)',
        
        // Text colors
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--text-tertiary) / <alpha-value>)',
        'text-quaternary': 'rgb(var(--text-quaternary) / <alpha-value>)',
        'text-on-tint': 'rgb(var(--text-on-tint) / <alpha-value>)',
        
        // Borders
        'border-hairline': 'rgb(var(--border-hairline) / <alpha-value>)',
        'border-medium': 'rgb(var(--border-medium) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
      },
      
      // Extended blur values for glass effects
      backdropBlur: {
        'glass': 'var(--glass-blur)',
        'glass-strong': 'var(--glass-blur-strong)',
      },
      
      // Extended opacity scale
      opacity: {
        '2.5': '0.025',
        '7.5': '0.075',
        '12.5': '0.125',
        '15': '0.15',
        '17.5': '0.175',
        '22.5': '0.225',
        '35': '0.35',
        '45': '0.45',
        '55': '0.55',
        '65': '0.65',
        '85': '0.85',
        '97.5': '0.975',
      },
      
      // Ring opacity for glass borders
      ringOpacity: {
        '12.5': '0.125',
        '15': '0.15',
        '17.5': '0.175',
        '22.5': '0.225',
        '35': '0.35',
      },
      
      // Box shadow for glass elevation
      boxShadow: {
        'glass': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'glass-xl': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        'glass-inner': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      
      // Border radius for iOS feel
      borderRadius: {
        'ios': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
      },
      
      // Transition timing for glass interactions
      transitionTimingFunction: {
        'glass': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'ios': 'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
      },
      
      // Animation durations
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [],
}

