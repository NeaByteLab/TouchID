/**
 * Cached Touch ID Authentication Example
 */

import { touchID } from '../src/touchid.js'

const testCachedAuthentication = async (): Promise<void> => {
  console.log('🔐 Cached Touch ID Authentication Example')
  console.log('========================================')

  try {
    const available = await touchID.isAvailable()
    console.log(`Touch ID Available: ${available ? '✅' : '❌'}`)

    if (!available) {
      console.log('❌ Touch ID not available on this device')
      return
    }

    console.log('\n2️⃣ Cached Authentication (30 seconds TTL)...')
    console.log('👉 Place your finger on the Touch ID sensor when prompted')
    console.log('💡 This will cache authentication for 30 seconds')
    
    const result = await touchID.authenticate({
      reason: 'Cached authentication - allows reuse for 30 seconds',
      method: 'cached',
      ttl: 30000 // 30 seconds
    })

    console.log('\n📋 Cached authentication result:', result)

    if (result.success) {
      console.log('✅ Cached authentication successful!')
      console.log('⏱️  Authentication cached for 30 seconds')
      
      if (result.data) {
        console.log('\n🔍 Device Identifiers:')
        console.log(`🔐 Biometry Type: ${result.data.biometryType}`)
        console.log(`🔑 Hardware UUID: ${result.data.hardwareUUID}`)
        console.log(`📱 Device Serial: ${result.data.deviceSerial}`)
        console.log(`🖥️  Device Model: ${result.data.deviceModel}`)
      }

      // Test multiple cached calls
      console.log('\n3️⃣ Testing Multiple Cached Calls...')
      
      for (let i = 1; i <= 3; i++) {
        console.log(`\n📞 Cached call ${i}/3...`)
        const cachedResult = await touchID.authenticate({
          reason: `Cached call ${i} - should be instant if within TTL`,
          method: 'cached',
          ttl: 30000
        })
        
        if (cachedResult.success) {
          console.log(`✅ Cached call ${i} successful!`)
        } else {
          console.log(`❌ Cached call ${i} failed: ${cachedResult.error}`)
        }
      }

    } else {
      console.log(`❌ Cached authentication failed: ${result.error || 'Unknown error'}`)
    }

  } catch (error) {
    console.error('❌ Cached authentication test error:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCachedAuthentication().catch(console.error)
} 