import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cardMint: "#47F4DF",
        cardNavy: "#0E1228",
        ink: "#0A0F20"
      }
    }
  },
  plugins: []
} satisfies Config;

