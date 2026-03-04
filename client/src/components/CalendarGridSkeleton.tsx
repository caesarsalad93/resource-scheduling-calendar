import { Skeleton } from "@/components/ui/skeleton";
import { START_HOUR, END_HOUR } from "@/lib/calendar-utils";

const COLUMN_COUNT = 5;
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

// Predefined fake event positions (row start in hours offset, height in rows)
const FAKE_EVENTS: { col: number; startRow: number; span: number }[] = [
  { col: 0, startRow: 1, span: 2 },
  { col: 0, startRow: 5, span: 3 },
  { col: 1, startRow: 0, span: 2 },
  { col: 1, startRow: 3, span: 1 },
  { col: 1, startRow: 6, span: 2 },
  { col: 2, startRow: 2, span: 3 },
  { col: 2, startRow: 7, span: 2 },
  { col: 3, startRow: 0, span: 1 },
  { col: 3, startRow: 3, span: 2 },
  { col: 3, startRow: 8, span: 2 },
  { col: 4, startRow: 1, span: 2 },
  { col: 4, startRow: 4, span: 3 },
  { col: 4, startRow: 9, span: 1 },
];

export function CalendarGridSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-max">
        {/* Header row */}
        <div
          className="grid border-b sticky top-0 bg-background z-10"
          style={{
            gridTemplateColumns: `var(--grid-time-col, 80px) repeat(${COLUMN_COUNT}, minmax(var(--grid-col-min, 160px), 1fr))`,
          }}
        >
          <div className="p-3 border-r" />
          {Array.from({ length: COLUMN_COUNT }, (_, i) => (
            <div key={i} className="p-3 border-r">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>

        {/* Time grid body */}
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `var(--grid-time-col, 80px) repeat(${COLUMN_COUNT}, minmax(var(--grid-col-min, 160px), 1fr))`,
          }}
        >
          {/* Time labels column */}
          <div className="border-r">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b px-2 py-1 flex items-start justify-end">
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>

          {/* Data columns */}
          {Array.from({ length: COLUMN_COUNT }, (_, colIdx) => (
            <div key={colIdx} className="border-r relative">
              {/* Grid lines */}
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-b" />
              ))}

              {/* Fake event blocks */}
              {FAKE_EVENTS.filter((e) => e.col === colIdx).map((block, j) => (
                <div
                  key={j}
                  className="absolute left-1 right-1"
                  style={{
                    top: `${block.startRow * 64 + 4}px`,
                    height: `${block.span * 64 - 8}px`,
                  }}
                >
                  <Skeleton className="h-full w-full rounded-md" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
