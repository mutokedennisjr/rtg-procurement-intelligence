/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rtg: {
          navy: "#1E293B", // Primary Dominant (Headers, Structure, Sidebar)
          gold: "#D97706", // Brand Accent (Key metrics, CTA buttons, active tabs)
          green: "#16A34A", // Secondary Accent (Savings achieved, price drops)
          crimson: "#DC2626", // Alert Accent (Price hikes, data exceptions)
          bg: "#F8FAFC", // Soft Neutral Background
        },
      },
    },
  },
  plugins: [],
};
