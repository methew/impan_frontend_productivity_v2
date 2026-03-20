import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)
afterEach(() => { cleanup() })

declare global {
  // eslint-disable-next-line no-var
  var matchMedia: typeof window.matchMedia
  // eslint-disable-next-line no-var
  var localStorage: typeof window.localStorage
  // eslint-disable-next-line no-var
  var ResizeObserver: typeof window.ResizeObserver
}

global.matchMedia = global.matchMedia || function() {
  return { matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }
}
global.localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() } as any
global.ResizeObserver = vi.fn().mockImplementation(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }))
