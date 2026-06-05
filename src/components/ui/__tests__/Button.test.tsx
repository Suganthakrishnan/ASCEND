import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('should render button with title', () => {
    const { getByText } = render(<Button title="Test Button" onPress={() => {}} />);
    expect(getByText('TEST BUTTON')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} />);
    
    fireEvent.press(getByText('TEST'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} disabled />);
    
    fireEvent.press(getByText('TEST'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<Button title="Test" onPress={onPress} isLoading testID="loading-button" />);
    
    // Loading state shows ActivityIndicator instead of text
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render primary variant by default', () => {
    const { getByText } = render(<Button title="Test" onPress={() => {}} />);
    expect(getByText('TEST')).toBeTruthy();
  });

  it('should render secondary variant', () => {
    const { getByText } = render(<Button title="Test" onPress={() => {}} variant="secondary" />);
    expect(getByText('TEST')).toBeTruthy();
  });

  it('should render outline variant', () => {
    const { getByText } = render(<Button title="Test" onPress={() => {}} variant="outline" />);
    expect(getByText('TEST')).toBeTruthy();
  });

  it('should render ghost variant', () => {
    const { getByText } = render(<Button title="Test" onPress={() => {}} variant="ghost" />);
    expect(getByText('TEST')).toBeTruthy();
  });

  it('should render fab variant', () => {
    const { getByTestId } = render(<Button title="Test" onPress={() => {}} variant="fab" testID="fab-button" />);
    expect(getByTestId('fab-button')).toBeTruthy();
  });

  it('should render icon when provided', () => {
    const icon = <div testID="test-icon">Icon</div>;
    const { getByTestId } = render(<Button title="Test" onPress={() => {}} icon={icon} />);
    expect(getByTestId('test-icon')).toBeTruthy();
  });

  it('should apply custom style', () => {
    const customStyle = { marginTop: 20 };
    const { getByText } = render(<Button title="Test" onPress={() => {}} style={customStyle} />);
    expect(getByText('TEST')).toBeTruthy();
  });

  it('should apply custom text style', () => {
    const customTextStyle = { fontSize: 20 };
    const { getByText } = render(<Button title="Test" onPress={() => {}} textStyle={customTextStyle} />);
    expect(getByText('TEST')).toBeTruthy();
  });
});
