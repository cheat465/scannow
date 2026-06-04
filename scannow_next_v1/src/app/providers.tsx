"use client";

import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VisitorTracker } from "./components/VisitorTracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <VisitorTracker />
        {children}
      </LanguageProvider>
    </ThemeProvider>
  );
}
