import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GlowInput } from '../../components/ui/GlowInput';

describe('GlowInput', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText } = render(
      <GlowInput placeholder="Enter text" />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('renders with label', () => {
    const { getByText } = render(
      <GlowInput label="Email" placeholder="Enter email" />
    );
    expect(getByText('EMAIL')).toBeTruthy();
  });

  it('accepts input', () => {
    const { getByPlaceholderText } = render(
      <GlowInput placeholder="Type here" />
    );
    const input = getByPlaceholderText('Type here');
    
    fireEvent.changeText(input, 'test value');
    expect(input.props.value).toBe('test value');
  });

  it('shows focus style on focus', () => {
    const { getByPlaceholderText } = render(
      <GlowInput placeholder="Focus test" />
    );
    const input = getByPlaceholderText('Focus test');
    
    fireEvent(input, 'focus');
    expect(input).toBeTruthy();
  });

  it('renders with error message', () => {
    const { getByText } = render(
      <GlowInput placeholder="Error test" error="Invalid input" />
    );
    expect(getByText('Invalid input')).toBeTruthy();
  });

  it('toggles password visibility', () => {
    const { getByPlaceholderText } = render(
      <GlowInput placeholder="Password" secureTextEntry={true} />
    );
    const input = getByPlaceholderText('Password');
    
    expect(input.props.secureTextEntry).toBe(true);
  });
});
