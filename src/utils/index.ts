/**
 * Utility functions
 * Common utilities for the Touch ID library
 *
 * @module utils
 */

/* global setTimeout, console */

import type { Result } from '@/types'

/**
 * Validate if a string is not empty
 * Checks for non-whitespace characters
 *
 * @param value - String to validate
 * @returns True if string is not empty, false otherwise
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0
}

/**
 * Create a success result
 * Factory function for successful operation results
 *
 * @template T - Type of data to include in result
 * @param data - Data to include in result
 * @returns Success result with data
 */
export const createSuccessResult = <T>(data: T): Result<T> => {
  return {
    success: true,
    data
  }
}

/**
 * Create an error result
 * Factory function for error operation results
 *
 * @template T - Type of data that would be returned on success
 * @param error - Error message
 * @returns Error result with message
 */
export const createErrorResult = <T>(error: string): Result<T> => {
  return {
    success: false,
    error
  }
}

/**
 * Delay execution for specified milliseconds
 * Creates promise that resolves after delay
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

/**
 * Retry an operation with exponential backoff
 * Attempts operation multiple times with increasing delays between attempts
 *
 * @template T - Type of operation result
 * @param operation - Operation to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds for backoff calculation
 * @returns Promise with operation result
 * @throws Last error encountered if all retries fail
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (attempt === maxRetries) {
        throw lastError
      }
      const delayMs = baseDelay * Math.pow(2, attempt)
      await delay(delayMs)
    }
  }

  throw lastError!
}

/**
 * Safe async operation wrapper
 * Wraps async operations with proper error handling
 *
 * @template T - Type of operation result
 * @param operation - Operation to execute
 * @param fallback - Fallback value if operation fails
 * @returns Promise with operation result or fallback
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    console.error('Safe async operation failed:', error)
    return fallback
  }
}

/**
 * Validate timeout value
 * Ensures timeout is within acceptable range
 *
 * @param timeout - Timeout value in milliseconds
 * @param min - Minimum allowed timeout (default: 1000)
 * @param max - Maximum allowed timeout (default: 300000)
 * @returns True if timeout is valid
 */
export const isValidTimeout = (
  timeout: number,
  min = 1000,
  max = 300000
): boolean => {
  return typeof timeout === 'number' && timeout >= min && timeout <= max
}

/**
 * Create error with context
 * Creates an error with additional context information
 *
 * @param message - Error message
 * @param context - Additional context information
 * @returns Error with context
 */
export const createContextError = (
  message: string,
  context?: Record<string, unknown>
): Error => {
  const error = new Error(message)
  if (context) {
    Object.assign(error, { context })
  }
  return error
}
