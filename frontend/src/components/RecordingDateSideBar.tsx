import React from "react";
import { format } from "date-fns";
import { CircleSmall } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { toZonedTime } from "date-fns-tz";
import { time } from "console";

interface Props {
  dates: string[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
}

const RecordingDateSidebar: React.FC<Props> = ({
  dates,
  selectedDate,
  onDateSelect,
}) => {
  const { user } = useUser();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className="border-r p-4">
      <h2 className="text-lg font-semibold my-8">Hi {user?.username}</h2>

      <h3 className="text-md font-light italic mb-2">
        {dates.length == 0 ? "Start recording your entries" : "Check out your entries"}
        </h3>
      <ul className="space-y-2">
        {dates.map((date) => (
          <li key={date} className="flex flex-row items-center">
            <CircleSmall />
            <button
              onClick={() => onDateSelect(date)}
              className={`w-full text-left px-3 py-2 button-select ${
                selectedDate === date ? "selected" : ""
              }`}
            >
              
              {format(toZonedTime(date, timezone), "PPPP")}
            </button>
          </li>
        ))}
      </ul>
      {selectedDate && (
        <button
          onClick={() => onDateSelect(null)}
          className="text-sm text-blue-600 hover:underline mt-4"
        >
          Clear selection
        </button>
      )}
    </div>
  );
};

export default RecordingDateSidebar;
