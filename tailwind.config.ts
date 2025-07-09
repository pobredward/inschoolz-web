import type { Config } from "tailwindcss";
import { shadcnPlugin } from "./src/lib/shadcn-plugin";
import lineClamp from '@tailwindcss/line-clamp';

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'sans': ['var(--font-noto-sans-kr)', 'system-ui', 'sans-serif'],
        'jammin': ['Gochi Hand', 'Comic Sans MS', 'cursive'], // 잼민이체 스타일
      },
      colors: {
        // 파스텔 그린 색상 팔레트
        'pastel-green': {
          50: '#f0fdf4',    // 매우 연한 그린
          100: '#dcfce7',   // 연한 그린
          200: '#bbf7d0',   // 파스텔 그린
          300: '#86efac',   // 메인 파스텔 그린
          400: '#4ade80',   // 살짝 진한 그린
          500: '#22c55e',   // 기본 그린
          600: '#16a34a',   // 진한 그린
          700: '#15803d',   // 더 진한 그린
          800: '#166534',   // 매우 진한 그린
          900: '#14532d',   // 가장 진한 그린
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#86efac", // 파스텔 그린으로 변경
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "#bbf7d0", // 파스텔 그린 accent
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
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
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [shadcnPlugin, lineClamp],
} satisfies Config;

export default config; 