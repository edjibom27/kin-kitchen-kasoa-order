import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { DateRange as RdpDateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DATE_RANGE_PRESETS,
  resolvePresetRange,
  type DateRange,
  type DateRangePreset,
} from "@/lib/admin-analytics";

export function AdminDateRangePicker({
  preset,
  range,
  onChange,
}: {
  preset: DateRangePreset;
  range: DateRange;
  onChange: (preset: DateRangePreset, range: DateRange) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  // Local draft for the calendar so partial selections (only "from" picked)
  // don't apply until the range is complete.
  const [draft, setDraft] = useState<RdpDateRange | undefined>({
    from: range.start,
    to: range.end,
  });

  function handlePresetClick(value: DateRangePreset) {
    if (value === "custom") {
      setDraft({ from: range.start, to: range.end });
      setPopoverOpen(true);
      return;
    }
    onChange(value, resolvePresetRange(value));
  }

  function handleCalendarSelect(selected: RdpDateRange | undefined) {
    setDraft(selected);
    if (selected?.from && selected.to) {
      onChange("custom", { start: selected.from, end: selected.to });
      setPopoverOpen(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DATE_RANGE_PRESETS.filter((p) => p.value !== "custom").map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant={preset === p.value ? "accent" : "outline"}
          onClick={() => handlePresetClick(p.value)}
        >
          {p.label}
        </Button>
      ))}

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={preset === "custom" ? "accent" : "outline"}
            className={cn("gap-1.5")}
            onClick={() => handlePresetClick("custom")}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {preset === "custom"
              ? `${format(range.start, "d MMM")} – ${format(range.end, "d MMM")}`
              : "Custom range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={draft}
            onSelect={handleCalendarSelect}
            defaultMonth={range.start}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
