// components/settings/buckets/PlaceholderBucket.tsx
export default function PlaceholderBucket({ label }: { label: string }) {
  return (
    <div className="placeholder-card">
      <h2>{label}</h2>
      <p>This settings section is coming soon.</p>
      <style jsx>{`
        .placeholder-card {
          background: #fff;
          border: 1px solid #ebebeb;
          border-radius: 14px;
          padding: 2rem;
          text-align: center;
        }
        h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #111;
          margin: 0 0 0.5rem;
        }
        p {
          color: #888;
          font-size: 0.95rem;
          margin: 0;
        }
      `}</style>
    </div>
  )
}