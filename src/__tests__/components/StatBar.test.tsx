import React from 'react';
import { render } from '@testing-library/react-native';
import { StatBar } from '../../components/ui/StatBar';

describe('StatBar', () => {
  it('renders with correct value prop', () => {
    const { getByText } = render(
      <StatBar label="Strength" current={50} max={100} />
    );
    expect(getByText('50/100')).toBeTruthy();
  });

  it('renders label correctly', () => {
    const { getByText } = render(
      <StatBar label="Agility" current={75} max={100} />
    );
    expect(getByText('AGILITY')).toBeTruthy();
  });

  it('renders with custom color', () => {
    const { getByText } = render(
      <StatBar label="Stamina" current={30} max={100} color="#ff0000" />
    );
    expect(getByText('30/100')).toBeTruthy();
  });

  it('renders without values when showValues is false', () => {
    const { queryByText } = render(
      <StatBar label="Intelligence" current={80} max={100} showValues={false} />
    );
    expect(queryByText('80/100')).toBeNull();
  });

  it('handles zero max value', () => {
    const { getByText } = render(
      <StatBar label="Test" current={50} max={0} />
    );
    expect(getByText('50/0')).toBeTruthy();
  });
});
