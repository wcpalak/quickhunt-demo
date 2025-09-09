/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": { max: "1400px" },
        xl: { max: "1200px" },
        lg: { max: "992px" },
        md: { max: "768px" },
        sm: { max: "639px" },
      },
    },
    // screens: {
    //   '2xl': {'max': '1400px'},
    //   'xl': {'max': '1200px'},
    //   'lg': {'max': '992px'},
    //   'md': {'max': '768px'},
    //   'sm': {'max': '639px'}
    // },
    extend: {
      boxShadow: {
        "3xl": "0px 1px 6px 0px rgba(0, 0, 0, 0.09)",
      },
      spacing: {
        106: "106px",
        198: "198px",
      },
      colors: {
        border: "hsl(var(--border))",
        borderColor: "hsl(var(--border-color))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      margin: {
        "b-1": "-1px",
        "l-8": "-8px",
      },
      fontSize: {
        exm: "8px",
      },
      animation: {
        "accordion-down": "accordion-down 0.1s ease-out",
        "accordion-up": "accordion-up 0.1s ease-out",
      },
    },
    containerType: {
      inlineSize: true,
    },
  },
  plugins: [require("tailwindcss-animate")],
};
