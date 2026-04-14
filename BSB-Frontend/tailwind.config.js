/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                bsb: {
                    bg: {
                        marketing: '#08090a',
                        panel: '#0f1011',
                        surface: '#191a1b',
                        secondary: '#28282c',
                    },
                    text: {
                        primary: '#f7f8f8',
                        secondary: '#d0d6e0',
                        tertiary: '#8a8f98',
                        quaternary: '#62666d',
                    },
                    accent: {
                        brand: '#5e6ad2',
                        violet: '#7170ff',
                        hover: '#828fff',
                    },
                    border: {
                        subtle: 'rgba(255,255,255,0.05)',
                        standard: 'rgba(255,255,255,0.08)',
                    },
                    status: {
                        green: '#27a644',
                        emerald: '#10b981',
                    },
                },
            },
            fontFamily: {
                sans: [
                    'Inter Variable',
                    'SF Pro Display',
                    '-apple-system',
                    'system-ui',
                    'Segoe UI',
                    'sans-serif',
                ],
                mono: ['Berkeley Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
            },
            fontWeight: {
                light: '300',
                normal: '400',
                emphasis: '510',
                semibold: '590',
            },
        },
    },
    plugins: [],
};
