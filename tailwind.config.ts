import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#2F5FDE",
          dark: "#2650C4",
        },
      },
    },
  },
  plugins: [],
};
export default config;
