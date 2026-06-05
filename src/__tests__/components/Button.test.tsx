import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    expect(getByText('TEST BUTTON')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Press Me" onPress={onPressMock} />
    );
    
    fireEvent.press(getByText('PRESS ME'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Disabled" onPress={onPressMock} disabled={true} />
    );
    
    fireEvent.press(getByText('DISABLED'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Loading" onPress={onPressMock} isLoading={true} />
    );
    
    fireEvent.press(getByText('LOADING'));
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
