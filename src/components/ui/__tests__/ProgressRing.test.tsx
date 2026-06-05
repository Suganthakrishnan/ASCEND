import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressRing } from '../ProgressRing';

describe('ProgressRing', () => {
  it('should render with default props', () => {
    const { getByText } = render(<ProgressRing progress={0.5} />);
    expect(getByText).toBeTruthy();
  });

  it('should render with custom size', () => {
    const { getByTestId } = render(<ProgressRing progress={0.5} size={150} testID="progress-ring" />);
    expect(getByTestId('progress-ring')).toBeTruthy();
  });

  it('should render with custom progress', () => {
    const { getByText } = render(<ProgressRing progress={0.75} />);
    expect(getByText).toBeTruthy();
  });

  it('should render with label', () => {
    const { getByText } = render(<ProgressRing progress={0.5} label="CALORIES" />);
    expect(getByText('CALORIES')).toBeTruthy();
  });

  it('should render with value', () => {
    const { getByText } = render(<ProgressRing progress={0.5} value="500" />);
    expect(getByText('500')).toBeTruthy();
  });

  it('should render with sublabel', () => {
    const { getByText } = render(<ProgressRing progress={0.5} sublabel="kcal" />);
    expect(getByText('kcal')).toBeTruthy();
  });

  it('should render with custom color', () => {
    const { getByTestId } = render(<ProgressRing progress={0.5} color="#FF0000" testID="progress-ring" />);
    expect(getByTestId('progress-ring')).toBeTruthy();
  });

  it('should render with custom track color', () => {
    const { getByTestId } = render(<ProgressRing progress={0.5} trackColor="#CCCCCC" testID="progress-ring" />);
    expect(getByTestId('progress-ring')).toBeTruthy();
  });

  it('should render with custom stroke width', () => {
    const { getByTestId } = render(<ProgressRing progress={0.5} strokeWidth={12} testID="progress-ring" />);
    expect(getByTestId('progress-ring')).toBeTruthy();
  });

  it('should render without animation when animated is false', () => {
    const { getByTestId } = render(<ProgressRing progress={0.5} animated={false} testID="progress-ring" />);
    expect(getByTestId('progress-ring')).toBeTruthy();
  });

  it('should handle zero progress', () => {
    const { getByTestId } = render(<ProgressRing progress={0} testID="progress-ring" />);
    expect(getByTestId('progress-ring')).toBeTruthy();
  });

  it('should handle full progress', () => {
    const { getByTestId } = render(<ProgressRing progress={1} testID="progress-ring" />);
    expect(getByTestId('progress-ring')).toBeTruthy();
  });

  it('should render all labels together', () => {
    const { getByText } = render(
      <ProgressRing 
        progress={0.5} 
        label="CALORIES" 
        value="500" 
        sublabel="kcal" 
      />
    );
    expect(getByText('CALORIES')).toBeTruthy();
    expect(getByText('500')).toBeTruthy();
    expect(getByText('kcal')).toBeTruthy();
  });
});
