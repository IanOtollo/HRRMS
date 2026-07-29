import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0F1B2C",
          700: "#1B2C42",
        },
        paper: {
          50: "#F7F5F0",
          100: "#EFEBE2",
          200: "#E2DCCE",
        },
        county: {
          green: {
            DEFAULT: "#9ECA3E", // Official Busia County Web Green
            dark: "#7A9E2D",
          },
          blue: {
            DEFAULT: "#202b5d", // Official Busia County Web Blue
            dark: "#141C3D",
          },
          black: "#000000",
        },
        seal: {
          bronze: "#A9822C",
        },
        slate: {
          teal: "#3D6B6B",
        },
        rust: {
          700: "#A13D2B",
        },
        text: {
          primary: "#151B23",
          secondary: "#5B6472",
          inverse: "#F2EFE8",
        },
      },
      fontFamily: {
        serif: ["var(--font-source-serif-4)"],
        sans: ["var(--font-inter)"],
        mono: ["var(--font-ibm-plex-mono)"],
      },
      fontSize: {
        "display-xl": ["32px", { lineHeight: "40px" }],
        "display-l": ["24px", { lineHeight: "32px" }],
        "display-m": ["18px", { lineHeight: "26px" }],
        "body-l": ["16px", { lineHeight: "24px" }],
        "body-m": ["14px", { lineHeight: "20px" }],
        "body-s": ["13px", { lineHeight: "18px" }],
        "mono-m": ["14px", { lineHeight: "20px", letterSpacing: "0.02em" }],
        "mono-s": ["12px", { lineHeight: "16px", letterSpacing: "0.03em" }],
      },
      spacing: {
        // Base unit is 4px, standard Tailwind spacing applies
        // We add specific ones if needed, but Tailwind 1=4px covers it.
        18: "72px",
        68: "272px",
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
      },
      boxShadow: {
        flat: "0 1px 3px rgba(15,27,44,0.08)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
