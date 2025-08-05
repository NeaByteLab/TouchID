# 🔐 TouchID

[![NPM Version](https://img.shields.io/npm/v/@neabyte/touchid.svg)](https://www.npmjs.com/package/@neabyte/touchid)
[![NPM Downloads](https://img.shields.io/npm/dm/@neabyte/touchid.svg)](https://www.npmjs.com/package/@neabyte/touchid)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **Native Touch ID Authentication for TypeScript** - A TypeScript library that provides native Touch ID authentication for macOS applications with strict coding standards and comprehensive type safety.

## 🙏 Credits

This library is inspired by and builds upon the excellent work of **[node-mac-auth](https://github.com/codebytere/node-mac-auth)** by [@codebytere](https://github.com/codebytere) (Shelley Vohr). The authentication flow and LocalAuthentication framework usage patterns are based on the node-mac-auth implementation, which provides a clean and reliable approach to Touch ID integration on macOS.

### **Enhancements Over node-mac-auth :**
- ✅ **Persistent caching** across process restarts
- ✅ **Device identifiers** (hardware UUID, serial, model)
- ✅ **TypeScript support** with full type safety
- ✅ **Modern ES modules** and async/await patterns
- ✅ **Enhanced error handling** and detailed error messages
- ✅ **Event System** for real-time monitoring and debugging

## 📋 Overview

This library provides **native Touch ID authentication** for TypeScript applications on macOS. Built with strict TypeScript coding standards, it offers a clean, type-safe API for biometric authentication with comprehensive event monitoring.

---

## 🎯 Features

### **🔐 Touch ID Authentication**
```typescript
import { touchID } from '@neabyte/touchid'

// Check if Touch ID is available
const available = await touchID.isAvailable()
console.log(`Touch ID available: ${available ? '✅' : '❌'}`)

// Direct authentication (always prompts)
const result = await touchID.authenticate({
  reason: 'Authenticate to access secure data',
  method: 'direct'
})

// Cached authentication (reuses recent auth)
const cachedResult = await touchID.authenticate({
  reason: 'Cached authentication',
  method: 'cached',
  ttl: 30000 // 30 seconds cache
})

if (result.success) {
  console.log('✅ Authentication successful!')
  console.log('Device:', result.data?.deviceModel)
  console.log('UUID:', result.data?.hardwareUUID)
} else {
  console.log(`❌ Authentication failed: ${result.error}`)
}
```

### **📡 Event System**
```typescript
// Real-time monitoring of authentication events
touchID.events.on('authentication:success', (event) => {
  console.log(`✅ Auth successful in ${event.duration}ms`)
  console.log(`Device: ${event.data?.deviceModel}`)
})

// Monitor device status
touchID.events.on('device:lockout', (event) => {
  console.log(`🔒 Device locked for ${event.duration}ms`)
})

// Track cache usage
touchID.events.on('cache:created', (event) => {
  console.log(`💾 Cache created with ${event.ttl}ms TTL`)
})

// One-time initialization listener
touchID.events.once('initialization:complete', (event) => {
  console.log(`✅ Service ready in ${event.duration}ms`)
})
```

### **🏗️ Native Performance**
- **Native C++ addon** for maximum performance
- **Direct macOS API access** via LocalAuthentication framework
- **Minimal overhead** - no Electron or heavy dependencies
- **Type-safe** TypeScript interface

### **🛡️ Security Features**
- **Biometric authentication** using Touch ID
- **Secure error handling** with detailed error messages
- **Graceful fallbacks** when Touch ID is unavailable
- **Promise-based API** for async operations

---

## 🚀 Quick Start

### Installation
```bash
# Install from npm
npm install @neabyte/touchid

# Or clone the repository
git clone https://github.com/NeaByteLab/TouchID.git
cd TouchID

# Install dependencies
npm install

# Build native addon
npm run build:native

# Run examples
npm run example:direct
npm run example:cached
npm run example:events
```

### Basic Usage
```typescript
import { TouchIDService, createTouchIDService } from '@neabyte/touchid'

// Use default instance
const touchID = createTouchIDService()

// Or create custom instance
const customTouchID = new TouchIDService()

// Check availability
const available = await touchID.isAvailable()

if (available) {
  // Authenticate with device data
  const result = await touchID.authenticate({
    reason: 'Access secure application',
    method: 'direct'
  })
  
  if (result.success) {
    console.log('Access granted!')
    console.log('Device info:', result.data)
  }
}
```

---

## 📁 Project Structure

```
TouchID/
├── src/                     # Source code
│   ├── native/              # Native C++ addon
│   │   └── touchid.mm       # Touch ID implementation
│   ├── types/               # TypeScript type definitions
│   │   ├── touchid.ts       # Touch ID types
│   │   └── index.ts         # Common types
│   ├── utils/               # Utility functions
│   │   ├── event-emitter.ts # Event system implementation
│   │   └── index.ts         # Common utilities
│   ├── touchid.ts           # Touch ID service
│   └── index.ts             # Main entry point
├── examples/                # Usage examples
│   ├── example-direct.ts    # Direct authentication example
│   ├── example-cached.ts    # Cached authentication example
│   └── example-events.ts    # Event system example
├── build/                   # Native addon build output
├── dist/                    # TypeScript build output
└── docs/                    # Auto-generated documentation
```

---

## 🔧 API Reference

### **TouchIDService**

#### `isAvailable(): Promise<boolean>`
Check if Touch ID is available on the device.

```typescript
const available = await touchID.isAvailable()
```

#### `authenticate(options?: TouchIDOptions): Promise<TouchIDResult>`
Authenticate using Touch ID.

```typescript
const result = await touchID.authenticate({
  reason: 'Authenticate to access secure data',
  method: 'direct',
  ttl: 30000
})
```

#### `test(): Promise<void>`
Run a test of Touch ID functionality.

```typescript
await touchID.test()
```

#### `events: TouchIDEventEmitter`
Access the event emitter for monitoring and debugging.

```typescript
// Listen for authentication events
touchID.events.on('authentication:success', (event) => {
  console.log(`Success in ${event.duration}ms`)
})

// Remove event listener
touchID.events.off('authentication:success', handler)

// One-time listener
touchID.events.once('initialization:complete', (event) => {
  console.log('Service ready!')
})
```

### **Event System**

#### **Authentication Events**
- `authentication:start` - Authentication process started
- `authentication:success` - Authentication completed successfully
- `authentication:failure` - Authentication failed
- `authentication:cancel` - User cancelled authentication

#### **Device Events**
- `device:available` - Touch ID device is available
- `device:unavailable` - Touch ID device is unavailable
- `device:lockout` - Device is locked out

#### **Cache Events**
- `cache:created` - New cache entry created
- `cache:expired` - Cache entry expired
- `cache:used` - Existing cache used

#### **Initialization Events**
- `initialization:start` - Service initialization started
- `initialization:complete` - Service initialization completed
- `initialization:error` - Service initialization failed

### **Types**

#### `TouchIDOptions`
```typescript
interface TouchIDOptions {
  readonly reason?: string
  readonly method?: 'direct' | 'cached'
  readonly ttl?: number // Time to live in milliseconds
}
```

#### `TouchIDResult`
```typescript
interface TouchIDResult {
  readonly success: boolean
  readonly error?: string
  readonly data?: DeviceData
}

interface DeviceData {
  readonly biometryType: 'TouchID' | 'FaceID' | 'None' | 'Unsupported'
  readonly hardwareUUID: string
  readonly deviceSerial: string
  readonly deviceModel: string
}
```

#### `TouchIDEventEmitter`
```typescript
interface TouchIDEventEmitter {
  on<T extends TouchIDEventType>(event: T, handler: TouchIDEventHandler<T>): void
  off<T extends TouchIDEventType>(event: T, handler: TouchIDEventHandler<T>): void
  once<T extends TouchIDEventType>(event: T, handler: TouchIDEventHandler<T>): void
  removeAllListeners(event?: TouchIDEventType): void
}
```

---

## 🧪 Testing

### Test Touch ID
```bash
# Run direct authentication example
npm run example:direct

# Run cached authentication example
npm run example:cached

# Run event system example
npm run example:events
```

---

## 🔨 Development

### Build Commands
```bash
# Build native addon
npm run build:native

# Build TypeScript
npm run build

# Development mode
npm run dev

# Quality checks
npm run check-all
```

### Development Workflow
1. **Edit C++ code** in `src/native/touchid.mm`
2. **Build native addon** with `npm run build:native`
3. **Edit TypeScript** in `src/touchid.ts`
4. **Test functionality** with `npm run example:direct`, `npm run example:cached`, or `npm run example:events`

---

## 📊 Requirements

### **System Requirements**
- **Node.js 22+**
- **macOS 10.15+** (Catalina or later)
- **Touch ID enabled device** (MacBook Pro with Touch Bar, etc.)

### **Development Requirements**
- **Xcode Command Line Tools**
- **C++ compiler**
- **TypeScript 5.9+**

---

## 🛡️ Security Notes

- **Touch ID data never leaves the device**
- **No biometric data is stored or transmitted**
- **Uses Apple's secure LocalAuthentication framework**
- **Follows macOS security best practices**

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run check-all`
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.