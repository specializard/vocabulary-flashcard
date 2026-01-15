import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { useState } from "react";

interface DateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  savedDates: string[]; // ISO date strings (YYYY-MM-DD)
  className?: string;
}

export function DateSelector({
  selectedDate,
  onDateSelect,
  savedDates,
  className,
}: DateSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      setOpen(false);
    }
  };

  const handleClearDate = () => {
    onDateSelect(null);
    setOpen(false);
  };

  // 저장된 날짜가 있는지 확인하는 함수
  const isDateSaved = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return savedDates.includes(dateStr);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "PPP", { locale: ko })
            ) : (
              <span>날짜 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleDateSelect}
            locale={ko}
            modifiers={{
              saved: (date) => isDateSaved(date),
            }}
            modifiersClassNames={{
              saved: "bg-accent text-accent-foreground font-bold",
            }}
            initialFocus
          />
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDate}
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              전체 보기
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {selectedDate && (
        <div className="text-xs text-muted-foreground text-center">
          {format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })} 저장된 단어
        </div>
      )}

      {savedDates.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent"></div>
            <span>단어가 저장된 날짜</span>
          </div>
        </div>
      )}
    </div>
  );
}
