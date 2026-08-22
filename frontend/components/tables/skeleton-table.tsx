interface SkeletonTableProps {
  columns?: number;
  rows?: number;
}

export function SkeletonTable({ columns = 4, rows = 5 }: SkeletonTableProps) {
  return (
    <div
      role="status"
      aria-label="Loading table"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className="h-3.5 flex-1 animate-pulse rounded bg-muted"
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 border-b border-border px-4 py-4 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-3.5 flex-1 animate-pulse rounded bg-muted"
              style={{ opacity: 1 - rowIndex * 0.12 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
