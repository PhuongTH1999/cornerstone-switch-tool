import Navbar from '../components/Navbar'

export default function SDUIPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <iframe
        src="/index.html?embed=true#/sdui/builder"
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
        }}
        title="SDUI Builder"
      />
    </div>
  )
}
