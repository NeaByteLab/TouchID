/**
 * Common type definitions
 * Shared types used throughout the Touch ID library
 *
 * @module types
 */

/**
 * Configuration options interface
 * Standard configuration for library components
 */
export interface ConfigOptions {
  readonly debug: boolean
  readonly timeout: number
  readonly retries: number
}

/**
 * Result type for operations
 * Generic result wrapper with success/failure states
 *
 * @template T - Type of data returned on success
 */
export type Result<T> = {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}

/**
 * Event handler type
 * Generic event handler function signature
 *
 * @template T - Type of event data
 */
export type EventHandler<T = unknown> = (event: T) => void

/**
 * Async operation type
 * Generic asynchronous operation function signature
 *
 * @template T - Type of operation result
 */
export type AsyncOperation<T> = () => Promise<T>

/**
 * Validation function type
 * Generic validation function signature
 *
 * @template T - Type of value to validate
 */
export type Validator<T> = (value: T) => boolean
