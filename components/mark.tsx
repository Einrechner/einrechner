export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0F4F4C" />
      <path d="M7 12.5h18M7 19.5h11" stroke="#F7F3EA" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="23.2" cy="19.5" r="2.15" fill="#E0A22A" />
    </svg>
  )
}
