/**
 * Touch ID Event System Example
 * Demonstrates how to use the event system for monitoring and debugging
 */

import { touchID } from '../src/touchid.js'

const testEventSystem = async (): Promise<void> => {
  console.log('🎯 Touch ID Event System Example')
  console.log('================================')

  // Set up event listeners
  console.log('\n📡 Setting up event listeners...')

  // Authentication events
  touchID.events.on('authentication:start', (event) => {
    console.log(`🚀 Authentication started: ${event.method} method`)
    console.log(`   Reason: ${event.reason}`)
    console.log(`   Timestamp: ${new Date(event.timestamp).toISOString()}`)
  })

  touchID.events.on('authentication:success', (event) => {
    console.log(`✅ Authentication successful!`)
    console.log(`   Method: ${event.method}`)
    console.log(`   Duration: ${event.duration}ms`)
    console.log(`   Device: ${event.data?.deviceModel || 'Unknown'}`)
  })

  touchID.events.on('authentication:failure', (event) => {
    console.log(`❌ Authentication failed:`)
    console.log(`   Method: ${event.method}`)
    console.log(`   Error: ${event.error}`)
    console.log(`   Duration: ${event.duration}ms`)
  })

  touchID.events.on('authentication:cancel', (event) => {
    console.log(`⏹️  Authentication cancelled by user`)
    console.log(`   Method: ${event.method}`)
    console.log(`   Duration: ${event.duration}ms`)
  })

  // Device events
  touchID.events.on('device:available', (event) => {
    console.log(`📱 Device available:`)
    console.log(`   Biometry Type: ${event.biometryType}`)
  })

  touchID.events.on('device:unavailable', (event) => {
    console.log(`❌ Device unavailable:`)
    console.log(`   Reason: ${event.reason}`)
  })

  touchID.events.on('device:lockout', (event) => {
    console.log(`🔒 Device locked out:`)
    console.log(`   Duration: ${event.duration}ms`)
    console.log(`   Reason: ${event.reason}`)
  })

  // Cache events
  touchID.events.on('cache:created', (event) => {
    console.log(`💾 Cache created:`)
    console.log(`   TTL: ${event.ttl}ms`)
  })

  touchID.events.on('cache:used', (event) => {
    console.log(`⚡ Cache used:`)
    console.log(`   Remaining TTL: ${event.remainingTtl}ms`)
  })

  touchID.events.on('cache:expired', (event) => {
    console.log(`⏰ Cache expired:`)
    console.log(`   Original TTL: ${event.originalTtl}ms`)
  })

  // Initialization events
  touchID.events.on('initialization:start', (event) => {
    console.log(`🔧 Initialization started`)
  })

  touchID.events.on('initialization:complete', (event) => {
    console.log(`✅ Initialization completed:`)
    console.log(`   Duration: ${event.duration}ms`)
  })

  touchID.events.on('initialization:error', (event) => {
    console.log(`❌ Initialization failed:`)
    console.log(`   Error: ${event.error}`)
  })

  // Test the event system
  console.log('\n🧪 Testing event system...')

  try {
    // Check availability (will trigger device events)
    console.log('\n1️⃣ Checking device availability...')
    const available = await touchID.isAvailable()
    console.log(`   Available: ${available ? '✅' : '❌'}`)

    if (available) {
      // Test direct authentication (will trigger auth events)
      console.log('\n2️⃣ Testing direct authentication...')
      const result = await touchID.authenticate({
        reason: 'Event system test - direct authentication',
        method: 'direct'
      })

      console.log(`   Result: ${result.success ? '✅ Success' : '❌ Failed'}`)

      // Test cached authentication (will trigger cache events)
      console.log('\n3️⃣ Testing cached authentication...')
      const cachedResult = await touchID.authenticate({
        reason: 'Event system test - cached authentication',
        method: 'cached',
        ttl: 10000 // 10 seconds
      })

      console.log(`   Result: ${cachedResult.success ? '✅ Success' : '❌ Failed'}`)

      // Test multiple cached calls to see cache usage
      console.log('\n4️⃣ Testing multiple cached calls...')
      for (let i = 1; i <= 3; i++) {
        const multiResult = await touchID.authenticate({
          reason: `Event system test - cached call ${i}`,
          method: 'cached',
          ttl: 10000
        })
        console.log(`   Call ${i}: ${multiResult.success ? '✅' : '❌'}`)
      }
    }

  } catch (error) {
    console.error('❌ Event system test error:', error)
  }

  // Show event statistics
  console.log('\n📊 Event Statistics:')
  const eventNames = touchID.events.eventNames()
  eventNames.forEach(eventName => {
    const count = touchID.events.listenerCount(eventName)
    console.log(`   ${eventName}: ${count} listener(s)`)
  })

  console.log('\n🎉 Event system test completed!')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testEventSystem().catch(console.error)
} 