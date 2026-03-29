/**
 * Memoized Callback Hooks - 优化回调函数
 */

import { useCallback, useRef, useEffect } from 'react'

/**
 * 使用 ref 保持回调函数引用稳定，避免不必要的重渲染
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    return callbackRef.current(...args)
  }, []) as T
}

/**
 * 防抖回调
 */
export function useDebouncedCallback<
  T extends (...args: any[]) => any
>(callback: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T
}

/**
 * 节流回调
 */
export function useThrottledCallback<
  T extends (...args: any[]) => any
>(callback: T, limit: number): T {
  const inThrottle = useRef(false)

  return useCallback((...args: Parameters<T>) => {
    if (!inThrottle.current) {
      callback(...args)
      inThrottle.current = true
      setTimeout(() => {
        inThrottle.current = false
      }, limit)
    }
  }, [callback, limit]) as T
}
