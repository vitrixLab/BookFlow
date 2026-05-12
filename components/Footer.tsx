// components/Footer.tsx
import Image from 'next/image'

export default function Footer() {
  return (
    <footer style={footerStyle}>
      <div style={innerStyle}>
        {/* Logo – replace with your actual logo file */}
        <div 
            style={{
                marginBottom: '-4px'
            }}>
          <Image
            src="/image/bookflow_primary_logo.png"
            alt="BookFlow"
            width={120}
            height={34}
            
              style={{
                filter: 'brightness(0) opacity(0.75)'
              }}
          />
        </div>
        <p style={copyrightStyle}>
          &copy; {new Date().getFullYear()} BookFlow. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

const footerStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'transparent',
  borderTop: '1px solid #e0e0e0',
  padding: '1.25rem 2rem',
  marginTop: '3rem',
}

const innerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
} 

const copyrightStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#666',
  margin: 0,
}