
export default function ToolsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <iframe
        src="/index.html?embed=true#/tools/rules"
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
        }}
        title="Cornerstone Tools"
      />
    </div>
  )
}
