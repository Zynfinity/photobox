/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		colors: {
			surface: '#1a1625',
			'surface-dim': '#0f0d15',
			'surface-bright': '#2d2535',
			'surface-lowest': '#0a0810',
			'surface-low': '#15121d',
			'surface-base': '#1f1a28',
			'surface-high': '#2a2332',
			'surface-highest': '#35303c',
			'on-surface': '#ede9f0',
			'on-surface-variant': '#c9c4d0',
			'inverse-surface': '#ede9f0',
			'inverse-on-surface': '#1a1625',
			outline: '#8e8a96',
			'outline-variant': '#49454e',
			primary: '#00d9d9',
			'primary-dim': '#00b3b3',
			'primary-active': '#008a8a',
			'on-primary': '#001a1a',
			'primary-container': '#004d4d',
			'on-primary-container': '#00ffff',
			secondary: '#d946ef',
			'on-secondary': '#2d0d2d',
			'secondary-container': '#6b1b7a',
			'on-secondary-container': '#f0b3ff',
			tertiary: '#ff006e',
			'on-tertiary': '#ffffff',
			'tertiary-container': '#8b0050',
			'on-tertiary-container': '#ffb3d9',
			error: '#ff4757',
			'on-error': '#ffffff',
			'error-container': '#8b0000',
			'on-error-container': '#ffb3b3',
			transparent: 'transparent',
			white: '#ffffff',
			black: '#000000',
			current: 'currentColor'
		},
		fontFamily: {
			display: ['"Instrument Serif"', 'serif'],
			sans: ['"Space Grotesk"', 'sans-serif'],
			mono: ['"Space Grotesk"', 'monospace']
		},
		fontSize: {
			display: ['96px', { lineHeight: '104px', letterSpacing: '-0.02em' }],
			'headline-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.015em' }],
			'headline-md': ['32px', { lineHeight: '40px' }],
			'title-lg': ['20px', { lineHeight: '28px', letterSpacing: '0.01em', fontWeight: '600' }],
			'body-lg': ['18px', { lineHeight: '28px' }],
			'body-md': ['16px', { lineHeight: '24px' }],
			'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '500' }],
			'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
			xs: ['11px', { lineHeight: '14px' }],
			sm: ['13px', { lineHeight: '18px' }],
			base: ['16px', { lineHeight: '24px' }],
			lg: ['18px', { lineHeight: '28px' }],
			xl: ['20px', { lineHeight: '28px' }],
			'2xl': ['24px', { lineHeight: '32px' }],
			'3xl': ['30px', { lineHeight: '36px' }],
			'4xl': ['36px', { lineHeight: '40px' }]
		},
		borderRadius: {
			none: '0',
			sm: '0.25rem',
			DEFAULT: '0.5rem',
			md: '0.75rem',
			lg: '1rem',
			xl: '1.5rem',
			'2xl': '2rem',
			full: '9999px'
		},
		boxShadow: {
			sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
			md: '0 4px 12px rgba(0, 0, 0, 0.4)',
			lg: '0 16px 40px rgba(0, 0, 0, 0.6)',
			'glow-primary': '0 0 24px rgba(0, 217, 217, 0.4)',
			'glow-primary-sm': '0 0 16px rgba(0, 217, 217, 0.2)',
			'glow-secondary': '0 0 24px rgba(217, 70, 239, 0.4)',
			'glow-tertiary': '0 0 24px rgba(255, 0, 110, 0.4)',
			'focus-ring': '0 0 0 3px rgba(0, 217, 217, 0.15)',
			none: 'none'
		},
		extend: {
			spacing: {
				unit: '8px',
				xs: '4px',
				sm: '12px',
				md: '24px',
				lg: '40px',
				xl: '64px'
			},
			maxWidth: {
				container: '1280px'
			},
			transitionTimingFunction: {
				playful: 'cubic-bezier(0.16, 1, 0.32, 1)'
			},
			gridTemplateColumns: {
				gallery: 'repeat(auto-fill, minmax(280px, 1fr))'
			},
			backgroundImage: {
				'neon-gradient': 'linear-gradient(135deg, #00d9d9 0%, #d946ef 50%, #ff006e 100%)',
				'surface-gradient': 'linear-gradient(160deg, #1a1625 0%, #0f0d15 100%)'
			},
			animation: {
				'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
				float: 'float 6s ease-in-out infinite'
			},
			keyframes: {
				pulseGlow: {
					'0%, 100%': { boxShadow: '0 0 10px rgba(0, 217, 217, 0.2)' },
					'50%': { boxShadow: '0 0 30px rgba(0, 217, 217, 0.5), 0 0 60px rgba(217, 70, 239, 0.2)' }
				},
				float: {
					'0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
					'33%': { transform: 'translateY(-8px) rotate(1deg)' },
					'66%': { transform: 'translateY(-4px) rotate(-1deg)' }
				}
			}
		}
	},
	plugins: []
};
