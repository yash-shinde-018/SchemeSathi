import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginForm from '../LoginForm';

describe('LoginForm Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login form with all fields', () => {
    render(
      <LoginForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email or Phone Number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('shows error when email/phone is empty', async () => {
    render(
      <LoginForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Email or phone number is required/)).toBeInTheDocument();
    });
  });

  it('shows error when password is empty', async () => {
    render(
      <LoginForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const emailInput = screen.getByLabelText(/Email or Phone Number/);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password is required/)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <LoginForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const emailInput = screen.getByLabelText(/Email or Phone Number/);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email or 10-digit phone number/)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    render(
      <LoginForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const emailInput = screen.getByLabelText(/Email or Phone Number/);
    fireEvent.change(emailInput, { target: { value: '12345' } });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email or 10-digit phone number/)).toBeInTheDocument();
    });
  });

  it('accepts valid email', async () => {
    const handleSubmit = vi.fn();
    render(
      <LoginForm onSubmit={handleSubmit} onNavigate={() => {}} />
    );

    const emailInput = screen.getByLabelText(/Email or Phone Number/);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const passwordInput = screen.getByLabelText(/Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it('accepts valid phone number', async () => {
    const handleSubmit = vi.fn();
    render(
      <LoginForm onSubmit={handleSubmit} onNavigate={() => {}} />
    );

    const emailInput = screen.getByLabelText(/Email or Phone Number/);
    fireEvent.change(emailInput, { target: { value: '9876543210' } });

    const passwordInput = screen.getByLabelText(/Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it('handles remember me checkbox', () => {
    render(
      <LoginForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const rememberMeCheckbox = screen.getByLabelText(/Remember me on this device/);
    expect(rememberMeCheckbox).not.toBeChecked();

    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
  });

  it('clears errors when user starts typing', async () => {
    render(
      <LoginForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Email or phone number is required/)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/Email or Phone Number/);
    fireEvent.change(emailInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.queryByText(/Email or phone number is required/)).not.toBeInTheDocument();
    });
  });

  it('stores user data in localStorage on successful login', async () => {
    const handleSubmit = vi.fn();
    render(
      <LoginForm onSubmit={handleSubmit} onNavigate={() => {}} />
    );

    const emailInput = screen.getByLabelText(/Email or Phone Number/);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const passwordInput = screen.getByLabelText(/Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      expect(storedUser).toBeDefined();
      expect(storedUser.emailOrPhone).toBe('test@example.com');
    });
  });

  it('calls onNavigate when navigation links are clicked', () => {
    const handleNavigate = vi.fn();
    render(
      <LoginForm onSubmit={() => {}} onNavigate={handleNavigate} />
    );

    const signUpLink = screen.getByRole('button', { name: /Sign up/i });
    fireEvent.click(signUpLink);

    expect(handleNavigate).toHaveBeenCalledWith('register');
  });

  it('displays success message on successful login', async () => {
    render(
      <LoginForm onSubmit={() => {}} onNavigate={() => {}} />
    );

    const emailInput = screen.getByLabelText(/Email or Phone Number/);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const passwordInput = screen.getByLabelText(/Password/);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Login successful/)).toBeInTheDocument();
    });
  });
});
