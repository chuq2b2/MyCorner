import React from "react";
import { format } from "date-fns";
import { CircleSmall } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { toZonedTime } from "date-fns-tz";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import OPTIONS from "@/lib/options";

interface Props {
  dates: string[];
  selectedDate: string | null;
  selectedTag: string | null;
  onTagSelect: (date: string | null) => void;
  onDateSelect: (date: string | null) => void;
}

const RecordingDateSidebar: React.FC<Props> = ({
  dates,
  selectedDate,
  selectedTag,
  onDateSelect,
  onTagSelect,
}) => {
  const { user } = useUser();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className=" p-4">
      <h2 className="text-lg font-semibold pt-8">Hi {user?.username}</h2>

      <h3 className="text-md font-light italic mb-2">
        {dates.length == 0
          ? "Start recording your entries"
          : "Check out your entries"}
      </h3>
      <Command className="bg-amber-50 rounded-lg">
        <CommandInput placeholder="Type to search..." />
        <CommandGroup heading="Dates" className="bg-white ">
          {dates.map((date) => (
            <CommandItem
              key={date}
              onSelect={() => onDateSelect(date)}
              className={`flex items-center text-black hover:bg-amber-100  ${
                selectedDate === date ? "underline" : ""
              }`}
            >
              <CircleSmall />
              {format(toZonedTime(date, timezone), "PPPP")}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tags" className="bg-white text-black">
          {OPTIONS.map((option, index) => (
            <CommandItem
              key={index}
              onSelect={() => !option.disable && onTagSelect(option.value)}
              className={`text-black ${
                selectedTag == option.value ? "underline text-black" : ""
              }`}
            >
              {option.value}
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>

      {(selectedDate || selectedTag) && (
        <button
          onClick={() => {
            onDateSelect(null);
            onTagSelect(null);
          }}
          className="border-0 text-sm text-blue-600 hover:underline mt-4 button-select"
        >
          Clear selection
        </button>
      )}
    </div>
  );
};

export default RecordingDateSidebar;
