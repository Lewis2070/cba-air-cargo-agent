// ThemeToggle.tsx - 主题切换组件
// v5.0 | 2026-03-26

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import { BulbOutlined } from '@ant-design/icons';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    // Apply to document body for Tailwind
    document.documentElement.classList.toggle('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <Tooltip title={`切换至${theme === 'dark' ? '浅色' : '深色'}模式`}>
      <Button
        icon={<BulbOutlined />}
        onClick={toggleTheme}
        type="text"
        style={{ color: theme === 'dark' ? '#FAAD14' : '#333' }}
      >
        {theme === 'dark' ? '深色' : '浅色'}
      </Button>
    </Tooltip>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
