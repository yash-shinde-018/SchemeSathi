import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormCheckbox from '../FormCheckbox';

describe('FormCheckbox Component', () => {
  it('renders checkbox with label', () => {
    render(
      <FormCheckbox
        id="test-checkbox"
        label="Accept terms"
        checked={false}
        onChange={() => {}}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();

    const label = screen.getByText('Accept terms');
    expect(label).toBeInTheDocument();
  });

  it('handles checked state', () => {
    render(
      <FormCheckbox
        id="test-checkbox"
        label="Accept terms"
        checked={true}
        onChange={() => {}}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('handles unchecked state', () => {
    render(
      <FormCheckbox
        id="test-checkbox"
        label="Accept terms"
        checked={false}
        onChange={() => {}}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('calls onChange when checkbox is toggled', () => {
    const handleChange = vi.fn();
    render(
      <FormCheckbox
        id="test-checkbox"
        label="Accept terms"
        checked={false}
        onChange={handleChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    render(
      <FormCheckbox
        id="test-checkbox"
        label="Accept terms"
        checked={false}
        onChange={() => {}}
        error="You must accept the terms"
      />
    );

    const errorMessage = screen.getByText('You must accept the terms');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('displays required indicator when required', () => {
    render(
      <FormCheckbox
        id="test-checkbox"
        label="Accept terms"
        checked={false}
        onChange={() => {}}
        required
      />
    );

    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <FormCheckbox
        id="test-checkbox"
        label="Accept terms"
        checked={false}
        onChange={() => {}}
        disabled
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('renders custom label element when provided', () => {
    render(
      <FormCheckbox
        id="test-checkbox"
        labelElement={<span>I agree to <a href="#">terms</a></span>}
        checked={false}
        onChange={() => {}}
      />
    );

    const link = screen.getByRole('link', { name: 'terms' });
    expect(link).toBeInTheDocument();
  });

  it('associates error with aria-describedby', () => {
    render(
      <FormCheckbox
        id="test-checkbox"
        label="Accept terms"
        checked={false}
        onChange={() => {}}
        error="This is required"
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-describedby', 'test-checkbox-error');
  });
});
