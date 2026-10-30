import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterForm from '../RegisterForm';

describe('RegisterForm Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders registration form with all fields', () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Create Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/)).toBeInTheDocument();
  });

  it('validates full name field', async () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Full name is required/)).toBeInTheDocument();
    });
  });

  it('validates full name minimum length', async () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const fullNameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(fullNameInput, { target: { value: 'A' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 2 characters/)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const fullNameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText(/Email Address/);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email address/)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const fullNameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText(/Email Address/);
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const phoneInput = screen.getByLabelText(/Phone Number/);
    fireEvent.change(phoneInput, { target: { value: '12345' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Enter a valid 10-digit phone number/)).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const fullNameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText(/Email Address/);
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const phoneInput = screen.getByLabelText(/Phone Number/);
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    const passwordInput = screen.getByLabelText(/Create Password/);
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const fullNameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText(/Email Address/);
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const phoneInput = screen.getByLabelText(/Phone Number/);
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    const passwordInput = screen.getByLabelText(/Create Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/)).toBeInTheDocument();
    });
  });

  it('requires terms and conditions acceptance', async () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const fullNameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText(/Email Address/);
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const phoneInput = screen.getByLabelText(/Phone Number/);
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    const passwordInput = screen.getByLabelText(/Create Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/You must agree to the Terms & Conditions/)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const passwordInput = screen.getByLabelText(/Create Password/);
    fireEvent.change(passwordInput, { target: { value: 'pass' } });

    expect(screen.getByText(/Password strength:/)).toBeInTheDocument();
  });

  it('accepts valid form data and stores in localStorage', async () => {
    const handleSubmit = vi.fn();
    render(
      <RegisterForm onSubmit={handleSubmit} onNavigate={() => {}} />
    );

    const fullNameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText(/Email Address/);
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const phoneInput = screen.getByLabelText(/Phone Number/);
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    const passwordInput = screen.getByLabelText(/Create Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      expect(storedUser).toBeDefined();
      expect(storedUser.fullName).toBe('John Doe');
      expect(storedUser.email).toBe('john@example.com');
    });
  });

  it('displays success message on successful registration', async () => {
    render(
      <RegisterForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const fullNameInput = screen.getByLabelText(/Full Name/);
    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText(/Email Address/);
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const phoneInput = screen.getByLabelText(/Phone Number/);
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });

    const passwordInput = screen.getByLabelText(/Create Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Account created successfully/)).toBeInTheDocument();
    });
  });
});
