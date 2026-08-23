"use client";

const HOURS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));
const PERIODS = ["AM", "PM"] as const;

interface TimeSelectProps {
  id?: string;
  /** 24-hour "HH:mm" value; empty string when unset. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function splitValue(value: string): { hour: string; minute: string; period: (typeof PERIODS)[number] } {
  const [rawHour = "", rawMinute = "00"] = value.split(":");
  const hour24 = Number(rawHour);
  if (!Number.isInteger(hour24)) return { hour: "9", minute: "00", period: "AM" };
  return {
    hour: String(hour24 % 12 || 12),
    minute: MINUTES.includes(rawMinute) ? rawMinute : "00",
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

const segmentClassName =
  "h-10 min-w-0 cursor-pointer appearance-none border-0 bg-transparent px-2.5 text-sm font-medium text-card-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60";

export function TimeSelect({ id, value, onChange, disabled }: TimeSelectProps) {
  const { hour, minute, period } = splitValue(value);

  function emit(nextHour: string, nextMinute: string, nextPeriod: string) {
    const base = Number(nextHour) % 12;
    const hour24 = nextPeriod === "PM" ? base + 12 : base;
    onChange(`${String(hour24).padStart(2, "0")}:${nextMinute}`);
  }

  return (
    <div className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-border bg-card shadow-xs">
      <select
        aria-label={`${id ?? "time"} hour`}
        value={hour}
        onChange={(event) => emit(event.target.value, minute, period)}
        disabled={disabled}
        className={segmentClassName}
      >
        {HOURS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span aria-hidden className="text-sm font-medium text-muted-foreground">
        :
      </span>
      <select
        aria-label={`${id ?? "time"} minutes`}
        value={minute}
        onChange={(event) => emit(hour, event.target.value, period)}
        disabled={disabled}
        className={segmentClassName}
      >
        {MINUTES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select
        aria-label={`${id ?? "time"} AM or PM`}
        value={period}
        onChange={(event) => emit(hour, minute, event.target.value)}
        disabled={disabled}
        className={`${segmentClassName} border-l border-border`}
      >
        {PERIODS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
