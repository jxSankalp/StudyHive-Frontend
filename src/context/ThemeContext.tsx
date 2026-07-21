import { useMemo, useState } from "react";
import { ThemeContext } from "./theme";
import type { Theme } from "./theme";

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem("studyhive-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = (nextTheme: Theme) => {
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("studyhive-theme", nextTheme);
    setThemeState(nextTheme);
  };

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark") }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
