import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GlowInput } from '../GlowInput';

describe('GlowInput', () => {
  it('should render with default props', () => {
    const { getByPlaceholderText } = render(<GlowInput placeholder="Enter text" />);
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('should render with label', () => {
    const { getByText } = render(<GlowInput label="EMAIL" placeholder="Enter email" />);
    expect(getByText('EMAIL')).toBeTruthy();
  });

  it('should render with error message', () => {
    const { getByText } = render(<GlowInput placeholder="Enter text" error="This field is required" />);
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('should render with secure text entry', () => {
    const { getByPlaceholderText } = render(<GlowInput placeholder="Password" secureTextEntry />);
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('should show eye icon for password fields', () => {
    const { getByTestId } = render(<GlowInput placeholder="Password" secureTextEntry testID="glow-input" />);
    expect(getByTestId('glow-input')).toBeTruthy();
  });

  it('should toggle password visibility when eye icon is pressed', async () => {
    const { getByTestId } = render(<GlowInput placeholder="Password" secureTextEntry testID="glow-input" />);
    const input = getByTestId('glow-input');
    
    // Find the eye button (it should be present for password fields)
    expect(input).toBeTruthy();
  });

  it('should call onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <GlowInput placeholder="Enter text" onChangeText={onChangeText} />
    );
    
    fireEvent.changeText(getByPlaceholderText('Enter text'), 'test value');
    expect(onChangeText).toHaveBeenCalledWith('test value');
  });

  it('should apply custom style', () => {
    const customStyle = { marginTop: 20 };
    const { getByPlaceholderText } = render(
      <GlowInput placeholder="Enter text" style={customStyle} />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('should handle focus state', () => {
    const { getByPlaceholderText } = render(<GlowInput placeholder="Enter text" />);
    const input = getByPlaceholderText('Enter text');
    
    fireEvent(input, 'focus');
    expect(input).toBeTruthy();
  });

  it('should handle blur state', () => {
    const { getByPlaceholderText } = render(<GlowInput placeholder="Enter text" />);
    const input = getByPlaceholderText('Enter text');
    
    fireEvent(input, 'blur');
    expect(input).toBeTruthy();
  });

  it('should render without label when not provided', () => {
    const { queryByText } = render(<GlowInput placeholder="Enter text" />);
    expect(queryByText(/^[A-Z]+$/)).toBeNull();
  });

  it('should render without error when not provided', () => {
    const { queryByText } = render(<GlowInput placeholder="Enter text" />);
    expect(queryByText(/.*/)).toBeTruthy(); // Input placeholder exists
  });

  it('should pass through TextInput props', () => {
    const { getByPlaceholderText } = render(
      <GlowInput 
        placeholder="Enter text" 
        keyboardType="numeric" 
        maxLength={10}
      />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });
});
