"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type Theme = "light" | "black";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_STORAGE_KEY = "nexus-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("black");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "black") {
        setThemeState(stored);
        document.documentElement.setAttribute("data-theme", stored);
        if (stored === "black") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        setThemeState("black");
        document.documentElement.setAttribute("data-theme", "black");
        document.documentElement.classList.add("dark");
      }
    } catch {
      setThemeState("black");
      document.documentElement.setAttribute("data-theme", "black");
      document.documentElement.classList.add("dark");
    }
    setMounted(true);
  }, []);

  const transitionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const applyThemeTransition = useCallback(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.add("theme-transitioning");
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
      transitionTimeoutRef.current = null;
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    applyThemeTransition();
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage errors (e.g. private browsing quota)
    }
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "black") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [applyThemeTransition]);

  const toggleTheme = useCallback(() => {
    applyThemeTransition();
    setThemeState((prev) => {
      const nextTheme: Theme = prev === "black" ? "light" : "black";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignore localStorage errors
      }
      document.documentElement.setAttribute("data-theme", nextTheme);
      if (nextTheme === "black") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return nextTheme;
    });
  }, [applyThemeTransition]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeProvider;
