/**
 * Event emitter utility
 * Provides event handling capabilities for Touch ID service
 *
 * @module event-emitter
 */

/* global console */

import type {
  TouchIDEventType,
  TouchIDEventHandler,
  TouchIDEventData,
  TouchIDEventEmitter
} from '@/types/touchid.js'

/**
 * Event listener entry
 * Internal structure for storing event listeners
 */
interface EventListener {
  handler: (data: TouchIDEventData[TouchIDEventType]) => void
  once: boolean
}

/**
 * Touch ID Event Emitter
 * Implements event handling for Touch ID service
 */
export class TouchIDEventEmitterImpl implements TouchIDEventEmitter {
  private listeners: Map<TouchIDEventType, EventListener[]> = new Map()

  /**
   * Register an event listener
   *
   * @param event - Event type to listen for
   * @param handler - Event handler function
   */
  public on<T extends TouchIDEventType>(
    event: T,
    handler: TouchIDEventHandler<T>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    this.listeners.get(event)!.push({
      handler: handler as (data: TouchIDEventData[TouchIDEventType]) => void,
      once: false
    })
  }

  /**
   * Remove an event listener
   *
   * @param event - Event type to remove listener from
   * @param handler - Event handler function to remove
   */
  public off<T extends TouchIDEventType>(
    event: T,
    handler: TouchIDEventHandler<T>
  ): void {
    const eventListeners = this.listeners.get(event)
    if (!eventListeners) {
      return
    }

    const index = eventListeners.findIndex(
      listener => listener.handler === handler
    )
    if (index !== -1) {
      eventListeners.splice(index, 1)
    }

    if (eventListeners.length === 0) {
      this.listeners.delete(event)
    }
  }

  /**
   * Register a one-time event listener
   *
   * @param event - Event type to listen for
   * @param handler - Event handler function
   */
  public once<T extends TouchIDEventType>(
    event: T,
    handler: TouchIDEventHandler<T>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    this.listeners.get(event)!.push({
      handler: handler as (data: TouchIDEventData[TouchIDEventType]) => void,
      once: true
    })
  }

  /**
   * Remove all event listeners
   *
   * @param event - Optional event type to remove all listeners from
   */
  public removeAllListeners(event?: TouchIDEventType): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * Emit an event to all registered listeners
   *
   * @param event - Event type to emit
   * @param data - Event data
   */
  public emit<T extends TouchIDEventType>(
    event: T,
    data: TouchIDEventData[T]
  ): void {
    const eventListeners = this.listeners.get(event)
    if (!eventListeners || eventListeners.length === 0) {
      return
    }

    // Create a copy of the listeners array to avoid modification during iteration
    const listenersToExecute = [...eventListeners]

    // Clear one-time listeners
    const remainingListeners = eventListeners.filter(listener => !listener.once)
    this.listeners.set(event, remainingListeners)

    // Execute all listeners
    for (const listener of listenersToExecute) {
      try {
        listener.handler(data)
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error)
      }
    }
  }

  /**
   * Get the number of listeners for an event
   *
   * @param event - Event type to check
   * @returns Number of listeners
   */
  public listenerCount(event: TouchIDEventType): number {
    const eventListeners = this.listeners.get(event)
    return eventListeners ? eventListeners.length : 0
  }

  /**
   * Get all registered event types
   *
   * @returns Array of registered event types
   */
  public eventNames(): TouchIDEventType[] {
    return Array.from(this.listeners.keys())
  }
}
