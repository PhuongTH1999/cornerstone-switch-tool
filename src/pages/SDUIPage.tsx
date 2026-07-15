import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SDUIPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === 'navigate') {
        navigate(event.data.path)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [navigate])

  return (
    <iframe
      src="/index.html"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
      }}
      title="Cornerstone SDUI Builder"
    />
  )
}
