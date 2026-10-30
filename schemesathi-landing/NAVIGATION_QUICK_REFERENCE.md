# Navigation Quick Reference

## How to Navigate Between Pages

The app now supports navigation between the landing page, login, and registration pages using a simple state-based routing system.

## Navigation Methods

### Method 1: From App.jsx (Parent Component)
```jsx
const [currentPage, setCurrentPage] = useState('home');

const handleNavigate = (page) => {
  setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Render different pages based on state
if (currentPage === 'login') return <LoginPage onNavigate={handleNavigate} />;
if (currentPage === 'register') return <RegisterPage onNavigate={handleNavigate} />;
```

### Method 2: From Any Component (Using onNavigate Prop)
```jsx
// In a component that receives onNavigate as a prop
<button onClick={() => onNavigate('login')}>Sign In</button>
<button onClick={() => onNavigate('register')}>Create Account</button>
<button onClick={() => onNavigate('home')}>Back to Home</button>
```

## Available Page Routes

- `'home'` - Landing page
- `'login'` - Login page
- `'register'` - Registration page
- `'dashboard'` - Dashboard (placeholder for Phase 2)
- `'forgot-password'` - Forgot password page (placeholder for Phase 2)
- `'terms'` - Terms & conditions page (placeholder for Phase 2)
- `'privacy'` - Privacy policy page (placeholder for Phase 2)

## Navigation Flow in Current Implementation

### Landing Page
- **"Sign In" button** → navigates to login page
- **"Get Started" or CTA buttons** → navigates to register page
- **"Learn More" links** → scroll to section

### Login Page
- **"Sign up" link** → navigates to register page
- **"Forgot password?" link** → navigates to forgot-password page (placeholder)
- **"Continue as Guest" button** → navigates to home page
- **On successful login** → navigates to dashboard (placeholder)

### Register Page
- **"Sign in" link** → navigates to login page
- **"Terms & Conditions" link** → navigates to terms page (placeholder)
- **"Privacy Policy" link** → navigates to privacy page (placeholder)
- **"Continue as Guest" button** → navigates to home page
- **On successful registration** → navigates to login page

## Passing Navigation to Components

### Header Component
```jsx
<Header 
  currentLanguage={currentLanguage}
  onLanguageChange={handleLanguageChange}
  onNavigate={handleNavigate}  // Add this
/>
```

### Footer Component
```jsx
<Footer
  currentLanguage={currentLanguage}
  onLanguageChange={handleLanguageChange}
  onNavigate={handleNavigate}  // Add this
/>
```

### Page Components
```jsx
<LoginPage onNavigate={handleNavigate} />
<RegisterPage onNavigate={handleNavigate} />
```

## Example: Adding "Sign In" Button to Hero Section

```jsx
// In HeroSection.jsx
export default function HeroSection({ onNavigate }) {
  return (
    <section className="hero">
      <button 
        onClick={() => onNavigate('login')}
        className="btn btn-primary"
      >
        Sign In
      </button>
    </section>
  );
}

// In App.jsx, pass the prop
<HeroSection onNavigate={handleNavigate} />
```

## Implementation Checklist

- [x] App.jsx updated with page state management
- [x] LoginPage and RegisterPage components created
- [x] Navigation between pages working
- [ ] Update Header component to accept and use onNavigate
- [ ] Update Footer component to accept and use onNavigate
- [ ] Update HeroSection to accept and use onNavigate (optional)
- [ ] Update CTASection to accept and use onNavigate (optional)
- [ ] Test all navigation links
- [ ] Add scroll-to-top on page change
- [ ] Add animations between page transitions (optional)

## Components That Need Navigation Props

1. **Header.jsx** - Should have links to sign in/register
2. **Footer.jsx** - Should have links to sign in/register
3. **HeroSection.jsx** - Should have CTA buttons for sign in/register (optional)
4. **CTASection.jsx** - Should have CTA buttons (optional)

## Testing Navigation

```jsx
// Test navigation from login to register
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './LoginPage';

it('navigates to register on sign up link click', () => {
  const handleNavigate = vi.fn();
  render(<LoginPage onNavigate={handleNavigate} />);
  
  const signUpLink = screen.getByRole('button', { name: /Sign up/i });
  fireEvent.click(signUpLink);
  
  expect(handleNavigate).toHaveBeenCalledWith('register');
});
```

## Future Enhancements

- [ ] React Router v6 integration (for URL-based routing)
- [ ] Breadcrumb navigation component
- [ ] Page transition animations
- [ ] Browser back button support
- [ ] URL persistence (deeplinks)
- [ ] Loading states for page transitions
- [ ] Error boundary for page errors

## Notes

- All navigation is client-side (instant, no page reload)
- Scroll position resets to top on page change
- localStorage is used to persist session state
- Protected routes can be added in Phase 2
- Route guards can be implemented for authentication checks
