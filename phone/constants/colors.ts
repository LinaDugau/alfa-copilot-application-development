const lightColors = {
  primary: "#EF3124",
  background: "#F5F5F5",
  white: "#FFFFFF",
  black: "#000000",
  text: {
    primary: "#000000",
    secondary: "#8E8E93",
    tertiary: "#C7C7CC",
  },
  card: {
    black: "#1C1C1E",
    red: "#EF3124",
    blue: "#007AFF",
  },
  border: "#E5E5EA",
  tabInactive: "#8E8E93",
  surface: "#FFFFFF",
  inputBackground: "#f3f4f6",
  messageBubble: {
    user: "#DC2626",
    assistant: "#FFFFFF",
    assistantBorder: "#e5e7eb",
  },
};

const darkColors = {
  primary: "#EF3124",
  background: "#000000",
  white: "#FFFFFF", 
  black: "#FFFFFF",
  text: {
    primary: "#FFFFFF",
    secondary: "#8E8E93",
    tertiary: "#48484A",
  },
  card: {
    black: "#1C1C1E",
    red: "#EF3124",
    blue: "#007AFF",
  },
  border: "#38383A",
  tabInactive: "#8E8E93",
  surface: "#1C1C1E",
  inputBackground: "#2C2C2E",
  messageBubble: {
    user: "#DC2626",
    assistant: "#1C1C1E",
    assistantBorder: "#38383A",
  },
};

export const getColors = (isDark: boolean) => (isDark ? darkColors : lightColors);

export default lightColors;