/**
 * Touch ID TypeScript Library
 * Native Touch ID authentication for macOS with device identification
 *
 * @module index
 */

export { TouchIDService, createTouchIDService, touchID } from '@/touchid.js'
export type { 
  TouchIDResult, 
  TouchIDOptions, 
  TouchIDInterface,
  TouchIDEventType,
  TouchIDEventData,
  TouchIDEventHandler,
  TouchIDEventEmitter
} from '@/types/touchid.js'
export { TouchIDEventEmitterImpl } from '@/utils/event-emitter.js'