import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  theme: 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always light theme
  const theme = 'light';
  
  // This function now does nothing since we only support light theme
  const toggleTheme = () => {
    // No-op function, theme remains light
    console.log('Light theme is the only supported theme');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
