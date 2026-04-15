"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value?: string; // "HH:mm" 24h format
  onChange: (value: string) => void;
}

function parse24h(time: string | undefined): {
  hour: string;
  minute: string;
  period: "AM" | "PM";
} {
  if (!time) return { hour: "12", minute: "00", period: "AM" };
  const [h, m] = time.split(":").map(Number);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return {
    hour: String(hour12),
    minute: String(m ?? 0).padStart(2, "0"),
    period,
  };
}

function to24h(hour: string, minute: string, period: "AM" | "PM"): string {
  let h = parseInt(hour, 10);
  if (period === "AM" && h === 12) h = 0;
  else if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);

export function TimePicker({ value, onChange }: TimePickerProps) {
  const { hour, minute, period } = parse24h(value);

  const update = (h: string, m: string, p: "AM" | "PM") => {
    onChange(to24h(h, m, p));
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={hour} onValueChange={(v) => update(v, minute, period)}>
        <SelectTrigger className="w-18">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-primary">
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground font-medium">:</span>

      <Select value={minute} onValueChange={(v) => update(hour, v, period)}>
        <SelectTrigger className="w-18">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-primary">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={period}
        onValueChange={(v) => update(hour, minute, v as "AM" | "PM")}>
        <SelectTrigger className="w-19">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-primary">
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
