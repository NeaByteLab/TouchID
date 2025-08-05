/**
 * Direct Touch ID Authentication Example
 */

import { touchID } from '../src/touchid.js'

const testDirectAuthentication = async (): Promise<void> => {
  console.log('🔐 Direct Touch ID Authentication Example')
  console.log('========================================')

  try {
    const available = await touchID.isAvailable()
    console.log(`Touch ID Available: ${available ? '✅' : '❌'}`)

    if (!available) {
      console.log('❌ Touch ID not available on this device')
      return
    }

    console.log('\n2️⃣ Direct Authentication (No Caching)...')
    console.log('👉 Place your finger on the Touch ID sensor when prompted')
    
    const result = await touchID.authenticate({
      reason: 'Direct authentication - requires Touch ID every time',
      method: 'direct'
    })

    console.log('\n📋 Direct authentication result:', result)

    if (result.success) {
      console.log('✅ Direct authentication successful!')
      console.log('🔒 This method provides maximum security')
      
      if (result.data) {
        console.log('\n🔍 Device Identifiers:')
        console.log(`🔐 Biometry Type: ${result.data.biometryType}`)
        console.log(`🔑 Hardware UUID: ${result.data.hardwareUUID}`)
        console.log(`📱 Device Serial: ${result.data.deviceSerial}`)
        console.log(`🖥️  Device Model: ${result.data.deviceModel}`)
      }
    } else {
      console.log(`❌ Direct authentication failed: ${result.error || 'Unknown error'}`)
    }

  } catch (error) {
    console.error('❌ Direct authentication test error:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testDirectAuthentication().catch(console.error)
} 