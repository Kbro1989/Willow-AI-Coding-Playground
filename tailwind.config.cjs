/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'forge-dark': '#050a15',
                'forge-panel': '#0a1222',
                'forge-border': '#1e293b',
                'forge-cyan': '#00f2ff',
                'forge-purple': '#a855f7',
            },
            fontFamily: {
                'mono': ['JetBrains Mono', 'monospace'],
                'sans': ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
