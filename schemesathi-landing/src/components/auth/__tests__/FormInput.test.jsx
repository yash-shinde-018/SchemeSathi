import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormInput from '../FormInput';

describe('FormInput Component', () => {
  it('renders input with label', () => {
    render(
      <FormInput
        id="test-input"
        label="Test Label"
        type="text"
        value=""
        onChange={() => {}}
      />
    );

    const label = screen.getByText('Test Label');
    expect(label).toBeInTheDocument();

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <FormInput
        id="test-input"
        label="Test Label"
        type="text"
        value=""
        onChange={() => {}}
        error="This field is required"
      />
    );

    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('shows password toggle button for password inputs', () => {
    render(
      <FormInput
        id="password"
        label="Password"
        type="password"
        value="secret"
        onChange={() => {}}
      />
    );

    const toggleButton = screen.getByLabelText('Show password');
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    render(
      <FormInput
        id="password"
        label="Password"
        type="password"
        value="secret"
        onChange={() => {}}
      />
    );

    const input = screen.getByDisplayValue('secret');
    const toggleButton = screen.getByLabelText('Show password');

    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);

    expect(input).toHaveAttribute('type', 'password');
  });

  it('calls onChange when input value changes', () => {
    const handleChange = vi.fn();
    render(
      <FormInput
        id="test-input"
        label="Test"
        type="text"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('displays required indicator when required', () => {
    render(
      <FormInput
        id="test-input"
        label="Required Field"
        type="text"
        value=""
        onChange={() => {}}
        required
      />
    );

    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
  });

  it('displays help text when provided', () => {
    render(
      <FormInput
        id="test-input"
        label="Test"
        type="text"
        value=""
        onChange={() => {}}
        helpText="This is helpful text"
      />
    );

    const helpText = screen.getByText('This is helpful text');
    expect(helpText).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <FormInput
        id="test-input"
        label="Test"
        type="text"
        value=""
        onChange={() => {}}
        disabled
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('uses placeholder when provided', () => {
    render(
      <FormInput
        id="test-input"
        label="Test"
        type="text"
        value=""
        onChange={() => {}}
        placeholder="Enter something"
      />
    );

    const input = screen.getByPlaceholderText('Enter something');
    expect(input).toBeInTheDocument();
  });
});
