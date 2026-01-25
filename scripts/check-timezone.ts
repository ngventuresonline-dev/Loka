/**
 * Timezone Verification Script
 * Checks system timezone configuration and displays current time in various formats
 */

console.log('='.repeat(60))
console.log('TIMEZONE VERIFICATION')
console.log('='.repeat(60))
console.log()

// System timezone info
const systemTZ = Intl.DateTimeFormat().resolvedOptions().timeZone
console.log('System timezone:', systemTZ)
console.log('Expected timezone: Asia/Kolkata')
console.log('Match:', systemTZ === 'Asia/Kolkata' ? '✅ YES' : '❌ NO')
console.log()

// Current time in different formats
const now = new Date()
console.log('Current time (UTC):', now.toISOString())
console.log('Current time (System):', now.toString())
console.log()

// IST formatted time
const istTime = now.toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'full',
  timeStyle: 'long'
})
console.log('Current time (IST):', istTime)
console.log()

// Using date-fns-tz
try {
  const { format } = require('date-fns')
  const { utcToZonedTime } = require('date-fns-tz')
  
  const istZonedTime = utcToZonedTime(now, 'Asia/Kolkata')
  const formattedIST = format(istZonedTime, 'yyyy-MM-dd HH:mm:ss')
  console.log('IST (date-fns-tz):', formattedIST)
  console.log()
} catch (error) {
  console.log('⚠️  date-fns-tz not available:', error.message)
  console.log()
}

// Environment variable check
console.log('Environment Variables:')
console.log('  TZ:', process.env.TZ || '(not set)')
console.log('  NODE_TZ:', process.env.NODE_TZ || '(not set)')
console.log()

// Database timezone check (if DATABASE_URL is available)
if (process.env.DATABASE_URL) {
  console.log('Database URL found')
  console.log('⚠️  To check PostgreSQL timezone, run:')
  console.log('    psql $DATABASE_URL -c "SHOW timezone;"')
  console.log('    psql $DATABASE_URL -c "SELECT now();"')
  console.log()
} else {
  console.log('⚠️  DATABASE_URL not found in environment')
  console.log()
}

console.log('='.repeat(60))
console.log('VERIFICATION COMPLETE')
console.log('='.repeat(60))
