import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('should merge classNames', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })
})
