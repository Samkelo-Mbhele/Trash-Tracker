export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-moss shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2 L14.5 9 L22 9.5 L16.5 14.5 L18.5 22 L12 17.5 L5.5 22 L7.5 14.5 L2 9.5 L9.5 9 Z"
            fill="#D9A441"
          />
        </svg>
      </span>
      <span className={`font-display text-base font-semibold ${light ? 'text-paper' : 'text-ink'}`}>Trash Tracker</span>
    </div>
  )
}
