/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,css}"],
  theme: {
    extend: {
      colors: {
        cream: "#F3EEE2",
        sage: {
          light: "#D8E4D2",
          deep: "#5B7C68",
        },
      },
      fontFamily: {
        display: ["Pretendard", "Noto Sans KR", "sans-serif"],
      },
    },
  },
  plugins: [],
};
