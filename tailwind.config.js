/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        skyblue: "#77BEF0",
      },
      keyframes: {
        moveClouds: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(120vw)" },
        },
      },
      animation: {
        clouds1: "moveClouds 50s linear infinite",
        clouds2: "moveClouds 70s linear infinite",
        clouds3: "moveClouds 60s linear infinite",
      },
    },
  },
  plugins: [],
};
