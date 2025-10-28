/**
 * Design System - FHEVM Snake Game
 * 
 * Deterministic design based on seed:
 * sha256("SnakeGamesepolia202510SnakeGame.sol")
 * 
 * Generated theme: Glassmorphism + Teal/Green/Cyan palette
 */

export const designTokens = {
  // Design metadata
  system: 'Glassmorphism',
  seed: 'a7f3d2b8e1c4f9a6',
  
  // Color palette - F group (Teal/Green/Cyan) - Fresh and natural
  colors: {
    light: {
      primary: '#14B8A6',      // Teal
      secondary: '#10B981',    // Green
      accent: '#06B6D4',       // Cyan
      background: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceGlass: 'rgba(248, 250, 252, 0.7)',
      text: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4',
    },
    dark: {
      primary: '#2DD4BF',      // Teal lighter
      secondary: '#34D399',    // Green lighter
      accent: '#22D3EE',       // Cyan lighter
      background: '#0F172A',
      surface: '#1E293B',
      surfaceGlass: 'rgba(30, 41, 59, 0.7)',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      border: '#334155',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#22D3EE',
    },
  },
  
  // Typography - Sans-Serif (Inter) with 1.25 scale
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    scale: 1.25,
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.25rem',    // 20px
      xl: '1.563rem',   // 25px
      '2xl': '1.953rem', // 31px
      '3xl': '2.441rem', // 39px
      '4xl': '3.052rem', // 49px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Spacing (8px base unit)
  spacing: {
    unit: 8,
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // Border radius (lg - 12px)
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // Shadows (md)
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.2)',
    glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  
  // Glassmorphism effects
  glass: {
    blur: 'blur(16px)',
    backdrop: 'saturate(180%) blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
  },
  
  // Animation durations (200ms - standard)
  transitions: {
    duration: {
      fast: '100ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // Layout mode: Tabs
  layout: {
    mode: 'tabs',
    maxWidth: '1280px',
    containerPadding: '1rem',
  },
  
  // Density variants
  density: {
    compact: {
      padding: {
        sm: '0.25rem 0.5rem',
        md: '0.5rem 1rem',
        lg: '0.75rem 1.5rem',
      },
      gap: '0.5rem',
    },
    comfortable: {
      padding: {
        sm: '0.5rem 1rem',
        md: '1rem 1.5rem',
        lg: '1.25rem 2rem',
      },
      gap: '1rem',
    },
  },
  
  // Responsive breakpoints (3-tier)
  breakpoints: {
    mobile: '0px',      // < 768px
    tablet: '768px',    // 768px - 1024px
    desktop: '1024px',  // > 1024px
  },
  
  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    toast: 1400,
  },
  
  // Game-specific tokens
  game: {
    canvas: {
      gridSize: 20,
      cellSize: 20,
      backgroundColor: '#1E293B',
      gridColor: 'rgba(100, 116, 139, 0.2)',
    },
    snake: {
      headColor: '#14B8A6',
      bodyColor: '#10B981',
      deadColor: '#64748B',
    },
    food: {
      color: '#F59E0B',
      glow: '0 0 20px rgba(245, 158, 11, 0.6)',
    },
  },
} as const;

export type DesignTokens = typeof designTokens;

