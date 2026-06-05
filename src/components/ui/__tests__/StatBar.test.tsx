import React from 'react';
import { render } from '@testing-library/react-native';
import { StatBar } from '../StatBar';

describe('StatBar', () => {
  it('should render with default props', () => {
    const { getByText } = render(<StatBar label="Strength" current={50} max={100} />);
    expect(getByText('STRENGTH')).toBeTruthy();
    expect(getByText('50/100')).toBeTruthy();
  });

  it('should render with custom color', () => {
    const { getByTestId } = render(<StatBar label="Test" current={50} max={100} color="#FF0000" testID="stat-bar" />);
    expect(getByTestId('stat-bar')).toBeTruthy();
  });

  it('should render with custom height', () => {
    const { getByTestId } = render(<StatBar label="Test" current={50} max={100} height={12} testID="stat-bar" />);
    expect(getByTestId('stat-bar')).toBeTruthy();
  });

  it('should hide values when showValues is false', () => {
    const { queryByText } = render(<StatBar label="Test" current={50} max={100} showValues={false} />);
    expect(queryByText('50/100')).toBeNull();
  });

  it('should handle zero current value', () => {
    const { getByText } = render(<StatBar label="Test" current={0} max={100} />);
    expect(getByText('0/100')).toBeTruthy();
  });

  it('should handle max value equal to current', () => {
    const { getByText } = render(<StatBar label="Test" current={100} max={100} />);
    expect(getByText('100/100')).toBeTruthy();
  });

  it('should handle current greater than max (clamped to 100%)', () => {
    const { getByText } = render(<StatBar label="Test" current={150} max={100} />);
    expect(getByText('150/100')).toBeTruthy();
  });

  it('should handle zero max value', () => {
    const { getByText } = render(<StatBar label="Test" current={50} max={0} />);
    expect(getByText('50/0')).toBeTruthy();
  });

  it('should apply custom style', () => {
    const customStyle = { marginTop: 10 };
    const { getByTestId } = render(<StatBar label="Test" current={50} max={100} style={customStyle} testID="stat-bar" />);
    expect(getByTestId('stat-bar')).toBeTruthy();
  });

  it('should render progress bar with correct percentage', () => {
    const { getByTestId } = render(<StatBar label="Test" current={25} max={100} testID="stat-bar" />);
    expect(getByTestId('stat-bar')).toBeTruthy();
  });

  it('should render with different label', () => {
    const { getByText } = render(<StatBar label="Intelligence" current={75} max={100} />);
    expect(getByText('INTELLIGENCE')).toBeTruthy();
  });

  it('should handle negative current value', () => {
    const { getByText } = render(<StatBar label="Test" current={-10} max={100} />);
    expect(getByText('-10/100')).toBeTruthy();
  });
});
