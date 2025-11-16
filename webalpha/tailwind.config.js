/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "hsl(var(--primary))", // #EF3124
          "primary-foreground": "hsl(var(--primary-foreground))", // #FFFFFF
          background: "hsl(var(--background))", // #F5F5F5 light / #000 dark
          foreground: "hsl(var(--foreground))", // #000 light / #FFF dark
          card: "hsl(var(--card))", // #FFF light / #1C1C1E dark
          "card-foreground": "hsl(var(--card-foreground))",
          surface: "hsl(var(--surface))", // #FFF light / #1C1C1E dark 
          border: "hsl(var(--border))", // #E5E5EA light / #38383A dark
          input: "hsl(var(--input))", // #f3f4f6 light / #2C2C2E dark 
          muted: "hsl(var(--muted))", // #F5F5F5 light / #1C1C1E dark
          mutedForeground: "hsl(var(--muted-foreground))", // #8E8E93 
          tabInactive: "#8E8E93",
          // Карточки счетов 
          cardBlack: "#1C1C1E",
          cardRed: "#EF3124",
          cardBlue: "#007AFF",
          messageUser: "#DC2626",
          messageAssistant: "hsl(var(--card))",
          messageAssistantBorder: "hsl(var(--border))",
          // Текст 
          textSecondary: "#8E8E93",
          textTertiary: "hsl(var(--muted-foreground))", // #C7C7CC light, #48484A dark
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }