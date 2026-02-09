/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                charcoal: {
                    950: '#0d0e0d',
                    900: '#1a1a1a',
                    850: '#202020',
                    800: '#2a2a2a',
                    700: '#333333',
                },
                text: {
                    primary: '#f2f2f2',
                    secondary: '#b6b6b6',
                    muted: '#8a8a8a',
                },
                accent: '#0097d5',
                'accent-strong': '#006487',
                danger: '#d64c4c',
                success: '#3fbf7f',
                warning: '#e1b84a',
                muted: {
                    DEFAULT: '#8a8a8a',
                    light: '#b6b6b6',
                }
            },
            fontFamily: {
                sans: ['IBM Plex Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Menlo', 'monospace'],
            },
            borderRadius: {
                none: '0px',
                sm: '0px',
                DEFAULT: '0px',
                md: '0px',
                lg: '0px',
                xl: '0px',
                '2xl': '0px',
                full: '0px',
            }
        },
    },
    plugins: [],
}
