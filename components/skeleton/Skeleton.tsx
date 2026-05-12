// components/skeleton/Skeleton.tsx
export default function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '6px',
  style = {},
}: {
  width?: string | number
  height?: string | number
  borderRadius?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  )
}