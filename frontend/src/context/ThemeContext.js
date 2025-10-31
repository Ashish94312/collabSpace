import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      const theme = saved ? JSON.parse(saved) : false;
      setIsDarkMode(theme);
      document.documentElement.setAttribute('data-theme', theme ? 'dark' : 'light');
    } catch (error) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};