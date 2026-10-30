/**
 * Constants File for SchemeSathi
 * 
 * Centralized configuration and constant values used throughout the application.
 */

/**
 * Responsive Design Breakpoints
 * Used for media queries and responsive layout decisions
 */
export const BREAKPOINTS = {
  mobile: 360,
  mobileMd: 480,
  tablet: 768,
  desktop: 1024,
  desktopLg: 1280,
  desktopXl: 1920,
};

/**
 * Navigation Menu Items - Desktop & Main Navigation
 * 3 Primary pages: Explore, How It Works, and Contact
 */
export const NAVIGATION_ITEMS = [
  {
    id: 'explore',
    label: 'Explore',
    href: '/explore',
    section: 'explore',
  },
  {
    id: 'how-it-works',
    label: 'How It Works',
    href: '/how-it-works',
    section: 'how-it-works',
  },
  {
    id: 'contact',
    label: 'Contact',
    href: '/contact',
    section: 'contact',
  },
];

/**
 * Mobile Navigation Items - Bottom Floating Navigation
 * 4 primary items with icons for modern floating mobile nav
 * Uses emoji icons for simplicity (can be replaced with SVG components)
 */
export const MOBILE_NAV_ITEMS = [
  {
    id: 'explore',
    label: 'Explore',
    href: '#categories',
    icon: '🔍',
    ariaLabel: 'Explore schemes and categories',
  },
  {
    id: 'categories',
    label: 'Categories',
    href: '#categories',
    icon: '📂',
    ariaLabel: 'Browse scheme categories',
  },
  {
    id: 'saved',
    label: 'Saved',
    href: '#saved',
    icon: '❤️',
    ariaLabel: 'View saved schemes (coming soon)',
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '#profile',
    icon: '👤',
    ariaLabel: 'User profile (coming soon)',
  },
];

/**
 * Language Configuration
 * Supported languages for the application
 */
export const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
  },
  {
    code: 'mr',
    label: 'Marathi',
    nativeLabel: 'मराठी',
  },
];

/**
 * Category List
 * All 10 scheme categories
 */
export const CATEGORY_LIST = [
  'Education & Scholarships',
  'Healthcare',
  'Agriculture',
  'Employment & Skills',
  'Housing',
  'Women & Child Welfare',
  'Social Welfare',
  'Entrepreneurship',
  'Senior Citizens',
  'Disability Support',
];

/**
 * Footer Sections
 * Links organized by footer section
 */
export const FOOTER_SECTIONS = {
  quickLinks: [
    { label: 'Home', href: '/' },
    { label: 'Explore Schemes', href: '/explore' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Citizen Login', href: '/login' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
    { label: 'Accessibility Statement', href: '/accessibility' },
  ],
};

/**
 * API Endpoints
 * TODO: These will be implemented in Phase 2 with Flask backend
 * Replace mockData.js imports with API calls to these endpoints
 */
export const API_ENDPOINTS = {
  categories: '/api/categories',
  schemes: '/api/schemes',
  scheemesFeatured: '/api/schemes/featured',
  workflows: '/api/workflows',
  features: '/api/features',
  // TODO: Authentication endpoints (Phase 2)
  // login: '/api/auth/login',
  // signup: '/api/auth/signup',
  // logout: '/api/auth/logout',
  // profile: '/api/auth/profile',
};

/**
 * Local Storage Keys
 * Keys used for storing data in browser's local storage
 */
export const STORAGE_KEYS = {
  language: 'schemesathi-language',
  userProfile: 'schemesathi-user-profile',
  savedSchemes: 'schemesathi-saved-schemes',
  theme: 'schemesathi-theme',
};

/**
 * Default Configuration
 */
export const DEFAULTS = {
  language: 'en',
  theme: 'light',
  itemsPerPage: 12,
  animationDuration: 300,
};

/**
 * Z-Index Stack
 * Consistent z-index values throughout the application
 */
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

/**
 * Animation Durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
};

/**
 * Touch Target Sizes
 * Minimum recommended sizes for accessibility
 */
export const TOUCH_TARGET_SIZES = {
  small: '32px',
  medium: '44px',
  large: '48px',
  xl: '56px',
};

/**
 * Section IDs
 * Used for anchor links and section identification
 */
export const SECTION_IDS = {
  home: 'home',
  categories: 'categories',
  howItWorks: 'how-it-works',
  whySchemeSathi: 'why-schemesathi',
  featuredSchemes: 'featured-schemes',
  trust: 'trust',
  cta: 'cta',
  contact: 'contact',
  footer: 'footer',
};

export default {
  BREAKPOINTS,
  NAVIGATION_ITEMS,
  LANGUAGES,
  CATEGORY_LIST,
  FOOTER_SECTIONS,
  API_ENDPOINTS,
  STORAGE_KEYS,
  DEFAULTS,
  Z_INDEX,
  ANIMATION_DURATIONS,
  TOUCH_TARGET_SIZES,
  SECTION_IDS,
};
