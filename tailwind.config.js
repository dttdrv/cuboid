/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                warm: {
                    950: '#141414',
                    900: '#1a1a1a',
                    850: '#1f1f1f',
                    800: '#262626',
                    700: '#333330',
                    600: '#444440',
                },
                /* Legacy alias so existing charcoal-* classes still compile */
                charcoal: {
                    950: '#141414',
                    900: '#1a1a1a',
                    850: '#1f1f1f',
                    800: '#262626',
                    700: '#333330',
                },
                page: { bg: '#141414' },
                panel: { bg: '#1a1a1a', raised: '#1f1f1f' },
                surface: {
                    rail: '#181818',
                    editor: '#161616',
                    drawer: '#1c1c1c',
                    elevated: '#242420',
                    muted: '#222220',
                    'status-bar': '#161614',
                    preview: '#121210',
                    composer: '#1a1a18',
                },
                border: {
                    subtle: '#2e2e2a',
                    active: '#444440',
                },
                text: {
                    primary: '#FAFAF5',
                    secondary: '#C8C5BD',
                    muted: '#8A8780',
                },
                accent: {
                    DEFAULT: '#FA520F',
                    strong: '#E14500',
                },
                danger: '#E05555',
                success: '#4CAF6E',
                warning: '#E5A530',
            },
            fontFamily: {
                sans: ['Inter', 'Rubik', 'Segoe UI', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
            },
            borderRadius: {
                none: '0px',
                sm: '6px',
                DEFAULT: '8px',
                md: '8px',
                lg: '12px',
                xl: '16px',
                '2xl': '20px',
                full: '9999px',
            },
        },
    },
    plugins: [],
}
