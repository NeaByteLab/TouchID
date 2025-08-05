/**
 * Touch ID authentication service
 * Native Touch ID for macOS with device identification
 *
 * @module touchid
 */

/* global console, setTimeout */

import type { TouchIDResult, TouchIDOptions, TouchIDInterface, BiometricInfo } from '@/types/touchid.js'
import { TouchIDError } from '@/types/touchid.js'
import { TouchIDEventEmitterImpl } from '@/utils/event-emitter.js'
import { fileURLToPath } from 'url'
import path from 'path'
import os from 'node:os'

/**
 * Check if the current platform is macOS
 *
 * @returns True if running on macOS, false otherwise
 */
function isMacOs(): boolean {
  return os.platform() === 'darwin'
}

/**
 * Validate Touch ID options
 *
 * @param options - Options to validate
 * @returns Validation result
 */
function validateOptions(options: TouchIDOptions): { valid: boolean; error?: string } {
  if (options.ttl !== undefined && (options.ttl < 1000 || options.ttl > 300000)) {
    return { valid: false, error: 'TTL must be between 1000 and 300000 milliseconds' }
  }
  if (options.reason !== undefined && options.reason.trim().length === 0) {
    return { valid: false, error: 'Reason cannot be empty' }
  }
  return { valid: true }
}

/**
 * Touch ID authentication service
 * Native Touch ID for macOS with direct and cached authentication
 *
 * @class TouchIDService
 * @implements TouchIDInterface
 */
export class TouchIDService implements TouchIDInterface {
  private nativeModule: any = null
  private initialized = false
  private initPromise: Promise<void> | null = null
  private eventEmitter: TouchIDEventEmitterImpl

  constructor() {
    this.eventEmitter = new TouchIDEventEmitterImpl()
    this.init()
  }

  /**
   * Get event emitter for registering event listeners
   *
   * @returns Event emitter instance
   */
  public get events(): TouchIDEventEmitterImpl {
    return this.eventEmitter
  }

  /**
   * Initialize the native Touch ID module
   * Loads the native addon and validates platform compatibility
   *
   * @private
   */
  private async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }
    this.initPromise = this._init()
    return this.initPromise
  }

  private async _init(): Promise<void> {
    const startTime = Date.now()
    this.eventEmitter.emit('initialization:start', { timestamp: startTime })
    if (!isMacOs()) {
      console.warn('⚠️ Touch ID is only available on macOS - skipping native module load')
      this.nativeModule = null
      this.initialized = true
      this.eventEmitter.emit('initialization:error', {
        timestamp: Date.now(),
        error: 'Touch ID is only available on macOS'
      })
      return
    }
    try {
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = path.dirname(__filename)
      const nativePath = path.join(__dirname, '../build/Release/touchid-native')
      const { createRequire } = await import('module')
      const require = createRequire(import.meta.url)
      this.nativeModule = require(nativePath)
      this.initialized = true
      this.eventEmitter.emit('initialization:complete', {
        timestamp: Date.now(),
        duration: Date.now() - startTime
      })
    } catch (error) {
      console.warn('Touch ID native module not available:', error)
      this.nativeModule = null
      this.initialized = true
      this.eventEmitter.emit('initialization:error', {
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown initialization error'
      })
    }
  }

  /**
   * Wait for initialization to complete
   * Polls the initialization status until the service is ready
   *
   * @private
   */
  private async waitForInit(): Promise<void> {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  /**
   * Check if Touch ID is available on this device
   * Validates platform compatibility and native module availability
   *
   * @returns True if Touch ID is available and functional
   */
  public async isAvailable(): Promise<boolean> {
    if (!isMacOs()) {
      console.warn('⚠️ Touch ID is only available on macOS')
      this.eventEmitter.emit('device:unavailable', {
        timestamp: Date.now(),
        reason: 'Touch ID is only available on macOS'
      })
      return false
    }
    await this.waitForInit()
    if (!this.nativeModule) {
      this.eventEmitter.emit('device:unavailable', {
        timestamp: Date.now(),
        reason: 'Touch ID native module not available'
      })
      return false
    }
    try {
      if (typeof this.nativeModule.canPromptTouchID === 'function') {
        const available = await this.nativeModule.canPromptTouchID()
        if (available) {
          this.eventEmitter.emit('device:available', {
            timestamp: Date.now(),
            biometryType: 'TouchID'
          })
        } else {
          this.eventEmitter.emit('device:unavailable', {
            timestamp: Date.now(),
            reason: 'Touch ID not available on this device'
          })
        }
        return available
      } else {
        throw new Error('canPromptTouchID function not available')
      }
    } catch (error) {
      console.error('Error checking Touch ID availability:', error)
      this.eventEmitter.emit('device:unavailable', {
        timestamp: Date.now(),
        reason: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  /**
   * Get biometric information and device identifiers
   * Retrieves device information including biometric type, hardware UUID, device serial, model, and system version
   *
   * @returns Biometric and device information
   */
  public async getBiometricInfo(): Promise<BiometricInfo> {
    if (!isMacOs()) {
      console.warn('⚠️ Touch ID is only available on macOS')
      const unsupportedPlatform = 'Unsupported Platform'
      return {
        biometricsAvailable: false,
        biometryType: 'Unsupported',
        deviceSerial: unsupportedPlatform,
        deviceModel: unsupportedPlatform,
        systemVersion: unsupportedPlatform,
        hardwareUUID: unsupportedPlatform
      }
    }
    await this.waitForInit()
    if (!this.nativeModule) {
      const emptyValue = ''
      return {
        biometricsAvailable: false,
        biometryType: 'None',
        deviceSerial: emptyValue,
        deviceModel: emptyValue,
        systemVersion: emptyValue,
        hardwareUUID: emptyValue
      }
    }
    try {
      if (typeof this.nativeModule.getBiometricInfo === 'function') {
        return await this.nativeModule.getBiometricInfo()
      } else {
        throw new Error('getBiometricInfo function not available')
      }
    } catch (error) {
      console.error('Error getting biometric info:', error)
      const errorValue = 'Error'
      return {
        biometricsAvailable: false,
        biometryType: 'None',
        deviceSerial: errorValue,
        deviceModel: errorValue,
        systemVersion: errorValue,
        hardwareUUID: errorValue
      }
    }
  }

  /**
   * Authenticate using Touch ID
   * Performs Touch ID authentication with optional caching support
   * Returns device identification data on successful authentication
   *
   * @param options - Authentication configuration options
   * @returns Authentication result with device data
   */
  public async authenticate(options: TouchIDOptions = {}): Promise<TouchIDResult> {
    const startTime = Date.now()
    const method = options.method || 'direct'
    const reason = options.reason || 'Authenticate with Touch ID'
    this.eventEmitter.emit('authentication:start', {
      timestamp: startTime,
      method,
      reason
    })
    if (!isMacOs()) {
      console.warn('⚠️ Touch ID is only available on macOS')
      const duration = Date.now() - startTime
      this.eventEmitter.emit('authentication:failure', {
        timestamp: Date.now(),
        method,
        error: TouchIDError.NOT_AVAILABLE,
        duration
      })
      return {
        success: false,
        error: TouchIDError.NOT_AVAILABLE
      }
    }
    const validation = validateOptions(options)
    if (!validation.valid) {
      const duration = Date.now() - startTime
      this.eventEmitter.emit('authentication:failure', {
        timestamp: Date.now(),
        method,
        error: validation.error!,
        duration
      })
      return {
        success: false,
        error: validation.error!
      }
    }
    await this.waitForInit()
    if (!this.nativeModule) {
      const duration = Date.now() - startTime
      this.eventEmitter.emit('authentication:failure', {
        timestamp: Date.now(),
        method,
        error: 'Touch ID native module not available',
        duration
      })
      return {
        success: false,
        error: 'Touch ID native module not available'
      }
    }
    try {
      const ttl = options.ttl || 30000
      if (typeof this.nativeModule.promptTouchID !== 'function') {
        throw new Error('promptTouchID function not available')
      }
      const result = await this.nativeModule.promptTouchID({
        reason,
        method,
        ttl
      })
      const duration = Date.now() - startTime
      if (result.success) {
        if (method === 'cached') {
          this.eventEmitter.emit('cache:created', {
            timestamp: Date.now(),
            ttl
          })
        }
        this.eventEmitter.emit('authentication:success', {
          timestamp: Date.now(),
          method,
          duration,
          data: result.data
        })
      } else {
        this.eventEmitter.emit('authentication:failure', {
          timestamp: Date.now(),
          method,
          error: result.error || 'Unknown error',
          duration
        })
      }
      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      let mappedError = errorMessage
      if (errorMessage.includes('not available')) {
        mappedError = TouchIDError.NOT_AVAILABLE
      } else if (errorMessage.includes('not enrolled')) {
        mappedError = TouchIDError.NOT_ENROLLED
      } else if (errorMessage.includes('locked out')) {
        mappedError = TouchIDError.LOCKOUT
        this.eventEmitter.emit('device:lockout', {
          timestamp: Date.now(),
          duration: 300000,
          reason: mappedError
        })
      } else if (errorMessage.includes('cancelled') || errorMessage.includes('canceled')) {
        mappedError = TouchIDError.USER_CANCEL
        const duration = Date.now() - startTime
        this.eventEmitter.emit('authentication:cancel', {
          timestamp: Date.now(),
          method,
          duration
        })
      } else if (errorMessage.includes('passcode not set')) {
        mappedError = TouchIDError.PASSCODE_NOT_SET
      } else if (errorMessage.includes('not interactive')) {
        mappedError = TouchIDError.NOT_INTERACTIVE
      }
      const duration = Date.now() - startTime
      this.eventEmitter.emit('authentication:failure', {
        timestamp: Date.now(),
        method,
        error: mappedError,
        duration
      })
      return {
        success: false,
        error: mappedError
      }
    }
  }

  /**
   * Test Touch ID functionality
   * Performs a test authentication to verify Touch ID is working correctly
   */
  public async test(): Promise<void> {
    const available = await this.isAvailable()
    if (available) {
      const result = await this.authenticate({
        reason: 'Test Touch ID authentication'
      })
      if (!result.success) {
        throw new Error(`Touch ID test failed: ${result.error}`)
      }
    } else {
      throw new Error('Touch ID is not available on this device')
    }
  }
}

/**
 * Create a Touch ID service instance
 * Factory function that creates a new TouchIDService instance
 *
 * @returns New Touch ID service instance
 */
export const createTouchIDService = (): TouchIDService => {
  return new TouchIDService()
}

/**
 * Default Touch ID service instance
 * Pre-configured Touch ID service for immediate use
 */
export const touchID = createTouchIDService() 