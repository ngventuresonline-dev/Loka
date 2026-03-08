'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f9fafb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>The app hit an error. You can try again.</p>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(to right, #FF5200, #E4002B)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
