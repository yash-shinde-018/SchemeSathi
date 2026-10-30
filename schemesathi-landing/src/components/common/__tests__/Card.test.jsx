import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Card from '../Card';

/**
 * Unit Tests for Card Component
 * **Validates: Requirements 1, 12, 13**
 * 
 * Tests Card component role changes, accessibility, interactivity,
 * content rendering, and keyboard navigation.
 */

describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render as article for static cards', () => {
      render(<Card title="Static Card" description="No interaction" />);
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      expect(card.tagName).toBe('ARTICLE');
    });

    it('should render as button with role=article for interactive cards', () => {
      render(
        <Card 
          title="Interactive" 
          description="Has onClick" 
          onClick={vi.fn()}
        />
      );
      const card = screen.getByRole('article');
      expect(card.tagName).toBe('BUTTON');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should render with title', () => {
      render(<Card title="Card Title" />);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should render with description', () => {
      render(<Card description="Card description text" />);
      expect(screen.getByText('Card description text')).toBeInTheDocument();
    });

    it('should render with both title and description', () => {
      render(
        <Card title="Title" description="Description" />
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(
        <Card 
          title="With Icon"
          icon={<span data-testid="icon">📦</span>}
        />
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render with image', () => {
      render(
        <Card 
          title="With Image"
          image="/test-image.jpg"
        />
      );
      const image = screen.getByAltText('With Image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
    });

    it('should render with custom children', () => {
      render(
        <Card>
          <h3>Custom Content</h3>
          <p>Custom paragraph</p>
        </Card>
      );
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
      expect(screen.getByText('Custom paragraph')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(
        <Card className="custom-class" title="Test" />
      );
      const card = screen.getByRole('article');
      expect(card).toHaveClass('custom-class');
    });

    it('should render with base card class', () => {
      render(<Card title="Card" />);
      const card = screen.getByRole('article');
      expect(card).toHaveClass('card');
    });
  });

  describe('Elevation Levels', () => {
    it('should render with small elevation', () => {
      render(<Card title="Small" elevation="sm" />);
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
      expect(card).toHaveStyle({ boxShadow: 'var(--shadow-sm)' });
    });

    it('should render with medium elevation by default', () => {
      render(<Card title="Medium" />);
      const card = screen.getByRole('article');
      expect(card).toHaveStyle({ boxShadow: 'var(--shadow-md)' });
    });

    it('should render with large elevation', () => {
      render(<Card title="Large" elevation="lg" />);
      const card = screen.getByRole('article');
      expect(card).toHaveStyle({ boxShadow: 'var(--shadow-lg)' });
    });
  });

  describe('Interactivity', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card 
          title="Interactive"
          onClick={handleClick}
        />
      );
      
      const card = screen.getByRole('article');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should be keyboard accessible with Enter', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card 
          title="Keyboard"
          onClick={handleClick}
        />
      );
      
      const card = screen.getByRole('article');
      card.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have pointer cursor for interactive cards', () => {
      render(
        <Card 
          title="Interactive" 
          onClick={vi.fn()}
        />
      );
      const card = screen.getByRole('article');
      expect(card).toHaveStyle({ cursor: 'pointer' });
    });

    it('should have default cursor for static cards', () => {
      render(<Card title="Static" />);
      const card = screen.getByRole('article');
      expect(card).toHaveStyle({ cursor: 'default' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper role for static card', () => {
      render(<Card title="Static" />);
      const card = screen.getByRole('article');
      expect(card.tagName).toBe('ARTICLE');
    });

    it('should have role=article for interactive button card', () => {
      render(
        <Card title="Interactive" onClick={vi.fn()} />
      );
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should render title as heading', () => {
      render(<Card title="Title Heading" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Title Heading');
    });

    it('should have alt text for images', () => {
      render(
        <Card 
          title="Card with Image"
          image="/test.jpg"
        />
      );
      const image = screen.getByAltText('Card with Image');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should prefer children over title and description', () => {
      render(
        <Card
          title="Will be hidden"
          description="Will be hidden"
        >
          <p>Custom content</p>
        </Card>
      );
      
      expect(screen.getByText('Custom content')).toBeInTheDocument();
      expect(screen.queryByText('Will be hidden')).not.toBeInTheDocument();
    });

    it('should display title as h3', () => {
      render(<Card title="Heading Level" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });

    it('should display description text', () => {
      render(
        <Card 
          title="Title"
          description="This is description text"
        />
      );
      const description = screen.getByText('This is description text');
      expect(description).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have background color', () => {
      render(<Card title="Styled" />);
      const card = screen.getByRole('article');
      const style = window.getComputedStyle(card);
      expect(style.backgroundColor).toBeTruthy();
    });

    it('should have border radius', () => {
      render(<Card title="Rounded" />);
      const card = screen.getByRole('article');
      const style = window.getComputedStyle(card);
      expect(style.borderRadius).toBeTruthy();
    });

    it('should have transition', () => {
      render(<Card title="Transition" />);
      const card = screen.getByRole('article');
      const style = window.getComputedStyle(card);
      // Transition should be applied
      expect(card.style.transition || style.transition).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should render with no props', () => {
      render(<Card />);
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });

    it('should handle missing title and description', () => {
      render(<Card icon={<span>Icon</span>} />);
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });

    it('should render with very long content', () => {
      const longText = 'This is a very long description '.repeat(10);
      render(<Card title="Long" description={longText} />);
      expect(screen.getByText(new RegExp(longText.substring(0, 30)))).toBeInTheDocument();
    });

    it('should handle rapid clicks on interactive card', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card title="Rapid" onClick={handleClick} />
      );
      
      const card = screen.getByRole('article');
      await user.click(card);
      await user.click(card);
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Props Combination', () => {
    it('should work with multiple props combined', () => {
      const handleClick = vi.fn();
      render(
        <Card
          title="Complete"
          description="Full featured"
          icon={<span>📦</span>}
          onClick={handleClick}
          className="custom"
          elevation="lg"
          interactive={true}
        />
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('card', 'card-interactive', 'custom');
      expect(card).toHaveAttribute('role', 'article');
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });
});
