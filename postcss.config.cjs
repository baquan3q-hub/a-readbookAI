// This file intentionally has no plugins.
// It exists to prevent PostCSS from picking up a global Tailwind v3
// config from a parent directory (C:\Users\84923\node_modules\tailwindcss).
// Tailwind v4 is handled entirely by the @tailwindcss/vite plugin.
module.exports = {
    plugins: [],
};
