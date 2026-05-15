import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // This will check the connection. Note: 'todos' table might not exist in your new project.
  const { data: testData, error } = await supabase.from('categories').select('*').limit(5)

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1 style={{ color: 'red' }}>Supabase Connection Error</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase Connected!</h1>
      <p>Current categories (test query):</p>
      <ul>
        {testData?.map((item: any) => (
          <li key={item.id}>{item.name}</li>
        ))}
        {testData?.length === 0 && <li>No categories found, but connection is OK.</li>}
      </ul>
    </div>
  )
}
