import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressRing } from '../../components/ui/ProgressRing';

describe('ProgressRing', () => {
  it('renders without crashing', () => {
    render(<ProgressRing progress={0.5} />);
  });

  it('renders with value', () => {
    const { getByText } = render(
      <ProgressRing progress={0.75} value="75%" />
    );
    expect(getByText('75%')).toBeTruthy();
  });

  it('renders with label', () => {
    const { getByText } = render(
      <ProgressRing progress={0.5} label="Calories" />
    );
    expect(getByText('CALORIES')).toBeTruthy();
  });

  it('renders with sublabel', () => {
    const { getByText } = render(
      <ProgressRing progress={0.5} sublabel="of 2000" />
    );
    expect(getByText('of 2000')).toBeTruthy();
  });

  it('renders with custom size', () => {
    render(<ProgressRing progress={0.5} size={150} />);
  });

  it('renders with custom color', () => {
    render(<ProgressRing progress={0.5} color="#ff0000" />);
  });

  it('renders with zero progress', () => {
    render(<ProgressRing progress={0} />);
  });

  it('renders with full progress', () => {
    render(<ProgressRing progress={1} />);
  });
});
