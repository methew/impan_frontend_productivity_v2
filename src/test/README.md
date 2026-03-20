# Testing Guide

This project uses [Vitest](https://vitest.dev/) for testing React components and utilities.

## Setup

Test configuration is defined in `vitest.config.ts` at the project root.

Test setup file: `src/test/setup.ts` - contains global mocks and configuration.

## Running Tests

```bash
# Run tests in watch mode (development)
pnpm test

# Run tests once (CI)
pnpm test:run

# Run tests with coverage report
pnpm test:coverage
```

## Writing Tests

### Test File Location

Place test files next to the code being tested or in a `__tests__` folder:

```
src/
  lib/
    utils.ts
    __tests__/
      utils.test.ts
  components/
    Button.tsx
    Button.test.tsx
```

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest'

describe('ComponentName', () => {
  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

### Testing Components

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })
})
```

### Testing Async Operations

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('asyncFunction', () => {
  it('should handle async operations', async () => {
    const result = await fetchData()
    expect(result).toEqual({ data: [] })
  })
})
```

## Available Matchers

This setup includes `@testing-library/jest-dom` matchers:

- `toBeInTheDocument()` - Check if element is in the document
- `toBeVisible()` - Check if element is visible
- `toHaveClass()` - Check element classes
- `toHaveTextContent()` - Check text content
- `toBeDisabled()` - Check if element is disabled

## Mocking

### Mocking Functions

```typescript
import { vi } from 'vitest'

const mockFn = vi.fn()
mockFn.mockReturnValue('mocked value')
```

### Mocking Modules

```typescript
import { vi } from 'vitest'

vi.mock('./api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: [] }))
}))
```

### Mocking Global Objects

Global mocks are already configured in `setup.ts`:
- `matchMedia`
- `localStorage`
- `ResizeObserver`

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Use meaningful test names** - Describe what is being tested and expected outcome
3. **Keep tests isolated** - Each test should be independent
4. **Use `screen` for queries** - Prefer `screen.getBy*` over `render` destructuring
5. **Clean up after tests** - Use `afterEach` for cleanup (handled automatically)

## Coverage Reports

Coverage reports are generated in the `coverage/` directory when running `pnpm test:coverage`.

Report formats:
- Terminal output (text)
- `coverage/coverage-final.json` (JSON)
- `coverage/index.html` (HTML - open in browser)

Excluded from coverage:
- node_modules
- Test files
- Type definition files
- Configuration files
- Auto-generated route tree
