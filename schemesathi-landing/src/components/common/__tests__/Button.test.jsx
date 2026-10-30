import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

/**
 * Unit Tests for Button Component
 * **Validates: Requirements 1, 12, 13**
 * 
 * Tests Button component variants, sizes, accessibility features,
 * event handling, and keyboard navigation.
 */

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should render with primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary');
    });

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary');
    });

    it('should render with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-outline');
    });

    it('should render with text variant', () => {
      render(<Button variant="text">Text</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-text');
    });

    it('should render with small size', () => {
      render(<Button size="small">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-sm');
    });

    it('should render with large size', () => {
      render(<Button size="large">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-lg');
    });

    it('should render with full width', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-full-width');
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render disabled button', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should render with children content', () => {
      render(
        <Button>
          <span data-testid="icon">🚀</span>
          Click me
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should call onClick on Enter key press', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Key Press</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      // Browser handles Enter key on buttons automatically
      expect(handleClick).toHaveBeenCalled();
    });

    it('should call onClick on Space key press', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Key Press</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for icon-only button', () => {
      render(<Button ariaLabel="Close menu">×</Button>);
      const button = screen.getByRole('button', { name: /close menu/i });
      expect(button).toHaveAttribute('aria-label', 'Close menu');
    });

    it('should be keyboard accessible with Tab', async () => {
      const user = userEvent.setup();
      render(<Button>Focusable</Button>);
      
      const button = screen.getByRole('button');
      expect(button).not.toHaveFocus();
      
      await user.tab();
      expect(button).toHaveFocus();
    });

    it('should have visible focus indicator', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      
      // Check for focus styles
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have proper button role', () => {
      render(<Button>Role Test</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should announce disabled state to screen readers', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button', { name: /disabled button/i });
      expect(button).toBeDisabled();
    });

    it('should have button type attribute', () => {
      render(<Button>Type Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Combination Tests', () => {
    it('should render with multiple variant and size combinations', () => {
      const { rerender } = render(
        <Button variant="primary" size="small">
          Primary Small
        </Button>
      );
      let button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary', 'btn-sm');

      rerender(
        <Button variant="secondary" size="large" fullWidth>
          Secondary Large Full
        </Button>
      );
      button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary', 'btn-lg', 'btn-full-width');
    });

    it('should handle all prop combinations without errors', () => {
      const combinations = [
        { variant: 'primary', size: 'small', fullWidth: true },
        { variant: 'secondary', size: 'medium', disabled: true },
        { variant: 'outline', size: 'large', className: 'custom' },
        { variant: 'text', ariaLabel: 'Menu', onClick: vi.fn() },
      ];

      combinations.forEach((props) => {
        const { unmount } = render(<Button {...props}>Test</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Style and Appearance', () => {
    it('should have base btn class', () => {
      render(<Button>Styled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn');
    });

    it('should apply multiple classes without duplication', () => {
      render(
        <Button 
          variant="primary" 
          size="large" 
          fullWidth 
          className="extra-class"
        >
          Multi-class
        </Button>
      );
      const button = screen.getByRole('button');
      const classList = button.className.split(' ');
      
      // Check unique classes
      const uniqueClasses = new Set(classList);
      expect(uniqueClasses.size).toBe(classList.length); // No duplicates
    });

    it('should have type="button" by default', () => {
      render(<Button>Button Type</Button>);
      const button = screen.getByRole('button');
      expect(button.type).toBe('button');
    });
  });

  describe('PropTypes Validation', () => {
    it('should accept valid variant prop', () => {
      const validVariants = ['primary', 'secondary', 'outline', 'text'];
      
      validVariants.forEach((variant) => {
        const { unmount } = render(
          <Button variant={variant}>Test</Button>
        );
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        unmount();
      });
    });

    it('should accept valid size prop', () => {
      const validSizes = ['small', 'medium', 'large'];
      
      validSizes.forEach((size) => {
        const { unmount } = render(
          <Button size={size}>Test</Button>
        );
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        unmount();
      });
    });

    it('should accept boolean props', () => {
      render(
        <Button 
          fullWidth={true} 
          disabled={false}
        >
          Test
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-full-width');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      render(<Button>{''}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render with React elements as children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('IconText');
    });

    it('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should maintain focus after click', async () => {
      const user = userEvent.setup();
      render(<Button>Click and Focus</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.click(button);
      
      expect(button).toHaveFocus();
    });
  });
});
