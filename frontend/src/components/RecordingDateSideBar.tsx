import React from "react";
import { format } from "date-fns";


interface Props {
  dates: string[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
}

const RecordingDateSidebar: React.FC<Props> = ({ dates, selectedDate, onDateSelect }) => {
  return (
    <div className="border-r p-4">
      <h2 className="text-lg font-semibold mb-2">Select a Date</h2>
      <ul className="space-y-2">
        {dates.map(date => (
          <li key={date}>
            <button
              onClick={() => onDateSelect(date)}
              className={`w-full text-left px-3 py-2 rounded-md transition ${
                selectedDate === date
                  ? "bg-blue-500 text-white font-medium shadow"
                  : "hover:bg-gray-100"
              }`}
            >
              {format(new Date(date), "PPPP")}
            </button>
          </li>
        ))}
      </ul>
      {selectedDate && (
        <button
          onClick={() => onDateSelect(null)}
          className="text-sm text-blue-600 mt-4"
        >
          Clear selection
        </button>
      )}
    </div>
  );
};

export default RecordingDateSidebar;