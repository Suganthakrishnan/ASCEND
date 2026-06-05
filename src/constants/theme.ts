export const theme = {
  colors: {
    // Backgrounds
    bg: {
      base: '#080B12',
      surface: '#080B12',
      glass: 'rgba(255,255,255,0.04)',
      glassBorder: 'rgba(255,255,255,0.08)',
    },
    // Primary colours
    primary: '#00E5FF',
    secondary: '#ffffff',
    gold: '#FFD60A',
    danger: '#FF3B5C',
    success: '#30D158',
    warning: '#FF9F0A',
    // Stat colours
    stats: {
      strength: '#FF453A',
      intelligence: '#00E5FF',
      stamina: '#30D158',
      codeKnowledge: '#BF5AF2',
      agility: '#FFD60A',
      communication: '#FF9F0A',
    },
    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#FFFFFF',
    },
    // Legacy compatibility
    background: '#000000',
    card: '#000000',
    cardGlass: 'rgba(255, 252, 252, 0.04)',
    primaryHover: '#00C4D4',
    tertiary: '#BF5AF2',
    textDimmed: '#8B95A8',
    glow: 'rgba(0,229,255,0.4)',
    border: 'rgba(255,255,255,0.08)',
    ghostBorder: 'rgba(0,229,255,0.3)',
    surfaceContainerHighest: '#ffffff',
    surfaceContainerLowest: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  touch: {
    buttonMinHeight: 52,
    tabBarHeight: 64,
    fabSize: 60,
    inputHeight: 52,
    listRowMinHeight: 56,
    chipHeight: 36,
  },
  border: {
    radius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
    width: 1,
  },
  glow: {
    cyan: {
      shadowColor: '#00E5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 5,
    },
    violet: {
      shadowColor: '#BF5AF2',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 5,
    },
    gold: {
      shadowColor: '#FFD60A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 5,
    },
    danger: {
      shadowColor: '#FF3B5C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 5,
    }
  },
  fonts: {
    heading: 'Rajdhani-Bold',
    body: 'System',
  }
};
