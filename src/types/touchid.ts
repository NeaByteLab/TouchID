/**
 * Device identifier data
 * Contains device-specific information retrieved during Touch ID authentication
 */
export interface DeviceData {
  readonly biometryType: 'TouchID' | 'FaceID' | 'None' | 'Unsupported'
  readonly hardwareUUID: string
  readonly deviceSerial: string
  readonly deviceModel: string
}

/**
 * Touch ID authentication result
 * Represents the outcome of a Touch ID authentication attempt
 */
export interface TouchIDResult {
  readonly success: boolean
  readonly error?: string
  readonly data?: DeviceData
}

/**
 * Touch ID authentication method
 * Defines the available authentication strategies
 */
export type TouchIDMethod = 'direct' | 'cached'

/**
 * Touch ID authentication options
 * Configuration options for Touch ID authentication requests
 */
export interface TouchIDOptions {
  readonly reason?: string
  readonly method?: TouchIDMethod
  /** Time to live in milliseconds for cached authentication */
  readonly ttl?: number
}

/**
 * Touch ID authentication interface
 * Defines the contract for Touch ID authentication services
 */
export interface TouchIDInterface {
  /**
   * Check if Touch ID is available on this device
   * Validates platform compatibility and native module availability
   *
   * @returns True if Touch ID is available and functional
   */
  isAvailable(): Promise<boolean>

  /**
   * Authenticate using Touch ID
   * Performs Touch ID authentication with optional caching support
   *
   * @param options - Authentication configuration options
   * @returns Authentication result with device data
   */
  authenticate(options?: TouchIDOptions): Promise<TouchIDResult>
}

/**
 * Biometric information and device identifiers
 * Device information including biometric capabilities and hardware identification data
 */
export interface BiometricInfo {
  readonly biometricsAvailable: boolean
  readonly biometryType: 'TouchID' | 'FaceID' | 'None' | 'Unsupported'
  readonly deviceSerial: string
  readonly deviceModel: string
  readonly systemVersion: string
  readonly hardwareUUID: string
}

/**
 * Touch ID error types
 * Standardized error codes for Touch ID authentication failures
 */
export enum TouchIDError {
  NOT_AVAILABLE = 'Touch ID not available',
  NOT_ENROLLED = 'No Touch ID enrolled',
  LOCKOUT = 'Touch ID is locked out',
  USER_CANCEL = 'User cancelled authentication',
  SYSTEM_CANCEL = 'System cancelled authentication',
  AUTHENTICATION_FAILED = 'Authentication failed',
  PASSCODE_NOT_SET = 'Passcode not set',
  NOT_INTERACTIVE = 'Not interactive'
}

/**
 * Touch ID event types
 * Defines all available event types for the Touch ID service
 */
export type TouchIDEventType =
  | 'authentication:start'
  | 'authentication:success'
  | 'authentication:failure'
  | 'authentication:cancel'
  | 'device:lockout'
  | 'device:available'
  | 'device:unavailable'
  | 'cache:created'
  | 'cache:used'
  | 'cache:expired'
  | 'initialization:start'
  | 'initialization:complete'
  | 'initialization:error'

/**
 * Touch ID event data
 * Contains data for different event types
 */
export interface TouchIDEventData {
  'authentication:start': {
    readonly timestamp: number
    readonly method: TouchIDMethod
    readonly reason?: string
  }
  'authentication:success': {
    readonly timestamp: number
    readonly method: TouchIDMethod
    readonly duration: number
    readonly data?: DeviceData
  }
  'authentication:failure': {
    readonly timestamp: number
    readonly method: TouchIDMethod
    readonly error: string
    readonly duration: number
  }
  'authentication:cancel': {
    readonly timestamp: number
    readonly method: TouchIDMethod
    readonly duration: number
  }
  'device:lockout': {
    readonly timestamp: number
    readonly duration: number
    readonly reason: string
  }
  'device:available': {
    readonly timestamp: number
    readonly biometryType: string
  }
  'device:unavailable': {
    readonly timestamp: number
    readonly reason: string
  }
  'cache:created': {
    readonly timestamp: number
    readonly ttl: number
  }
  'cache:used': {
    readonly timestamp: number
    readonly remainingTtl: number
  }
  'cache:expired': {
    readonly timestamp: number
    readonly originalTtl: number
  }
  'initialization:start': {
    readonly timestamp: number
  }
  'initialization:complete': {
    readonly timestamp: number
    readonly duration: number
  }
  'initialization:error': {
    readonly timestamp: number
    readonly error: string
  }
}

/**
 * Touch ID event handler
 * Generic event handler for Touch ID events
 */
export type TouchIDEventHandler<T extends TouchIDEventType = TouchIDEventType> =
  (event: TouchIDEventData[T]) => void

/**
 * Touch ID event emitter interface
 * Defines the event emitter contract for Touch ID service
 */
export interface TouchIDEventEmitter {
  /**
   * Register an event listener
   *
   * @param event - Event type to listen for
   * @param handler - Event handler function
   */
  on<T extends TouchIDEventType>(
    event: T,
    handler: TouchIDEventHandler<T>
  ): void

  /**
   * Remove an event listener
   *
   * @param event - Event type to remove listener from
   * @param handler - Event handler function to remove
   */
  off<T extends TouchIDEventType>(
    event: T,
    handler: TouchIDEventHandler<T>
  ): void

  /**
   * Register a one-time event listener
   *
   * @param event - Event type to listen for
   * @param handler - Event handler function
   */
  once<T extends TouchIDEventType>(
    event: T,
    handler: TouchIDEventHandler<T>
  ): void

  /**
   * Remove all event listeners
   *
   * @param event - Optional event type to remove all listeners from
   */
  removeAllListeners(event?: TouchIDEventType): void
}
