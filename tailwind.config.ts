import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './lib/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'ui-sans-serif',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Helvetica Neue',
                    'Arial',
                    'sans-serif',
                ],
                serif: ['Lyon-Text', 'Georgia', 'ui-serif', 'serif'],
                mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
            },
            colors: {
                canvas: {
                    light: '#ffffff',
                    dark: '#191919',
                },
                sidebar: {
                    light: '#fbfbfa',
                    dark: '#202020',
                },
                border: {
                    light: '#e9e9e7',
                    dark: '#2f2f2f',
                },
                ink: {
                    light: '#37352f',
                    dark: '#e9e9e7',
                },
                muted: {
                    light: '#9b9a97',
                    dark: '#6f6f6c',
                },
                hover: {
                    light: '#f1f1ef',
                    dark: '#2c2c2c',
                },
                accent: '#2383e2',
            },
            boxShadow: {
                panel: '0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
                popover:
                    'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(-2px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                fadeIn: 'fadeIn 0.12s ease-out',
            },
        },
    },
    plugins: [],
};

export default config;
