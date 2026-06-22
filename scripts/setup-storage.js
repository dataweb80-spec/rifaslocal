const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ezmbuyvabfikifhrndxy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bWJ1eXZhYmZpa2lmaHJuZHh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA4NTYxMSwiZXhwIjoyMDk3NjYxNjExfQ.gK2Wmf0EE02X23fu4-buFdyymGo-IOCOrlFj12F4a-o',
  { realtime: { transport: require('ws') } }
)

async function run() {
  const { error } = await supabase.storage.createBucket('rifas', {
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  })
  if (error && !error.message.includes('already exists')) {
    console.error('Error:', error.message)
  } else {
    console.log('✓ Bucket "rifas" listo')
  }
  process.exit(0)
}
run()
