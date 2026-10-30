import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

window.IntersectionObserver = MockIntersectionObserver

// Default mock for react-router-dom's useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Default mock for useAuth hook
vi.mock('./src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn().mockImplementation((emailOrPhone) => Promise.resolve({ success: true, user: { email: emailOrPhone } })),
    register: vi.fn().mockImplementation((data) => Promise.resolve({ success: true, user: data })),
    logout: vi.fn().mockResolvedValue({ success: true }),
    isLoading: false,
    error: null,
  }),
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') || args[0].includes('useAuth must be used'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
