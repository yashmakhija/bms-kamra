import type { Config } from "postcss-load-config";

export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
} satisfies Config;
