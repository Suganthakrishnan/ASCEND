import React from 'react';
import { View, Text } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { theme } from '../../constants/theme';

export function GenericPlaceholder({ route }: any) {
  const name = route.name || 'UNKNOWN MODULE';

  return (
    <ScreenWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ 
        color: theme.colors.primary, 
        fontSize: 24, 
        fontWeight: '900',
        textShadowColor: theme.colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        marginBottom: 16
      }}>
        {name.toUpperCase()}
      </Text>
      <Text style={{ color: theme.colors.textDimmed, letterSpacing: 2, fontSize: 12 }}>
        MODULE UNDER CONSTRUCTION
      </Text>
    </ScreenWrapper>
  );
}
