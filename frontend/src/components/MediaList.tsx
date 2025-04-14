import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/clerk-react";
import RecordingDateSidebar from "./RecordingDateSideBar";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Recording {
  id: string;
  user_id: string;
  file_url: string;
  file_type: "audio" | "video";
  note: string | null;
  created_at: string;
}

export default function MediaList() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("audio");
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      fetchRecordings();
      console.log("Current user ID:", user.id);
    }
  }, [isLoaded, user]);

  const fetchRecordings = async () => {
    if (!user) {
      console.log("No user found when trying to fetch recordings.");
      return;
    }

    console.log("Fetching recordings for user:", user.id);

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("recordings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      console.log("Supabase data:", data);
      console.log("Supabase error:", error);
      if (error) throw error;

      const audio = data.filter((r) => r.file_type === "audio");
      const video = data.filter((r) => r.file_type === "video");

      setRecordings(
        [...audio, ...video].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
      console.log("Final recordings to render:", recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setFilteredRecordings(
        recordings.filter((r) => {
          const localDate = toZonedTime(r.created_at, timezone);
          return format(localDate, "yyyy-MM-dd") === selectedDate;
        })
      );
    } else {
      setFilteredRecordings(recordings);
    }
  }, [selectedDate, recordings]);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const availableDates = Array.from(
    new Set(
      recordings.map((r) =>
        format(toZonedTime(r.created_at, timezone), "yyyy-MM-dd")
      )
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // const renderRecording = (recording: Recording) => {
  //   const localDate = toZonedTime(
  //     recording.created_at,
  //     Intl.DateTimeFormat().resolvedOptions().timeZone
  //   );

  //   return (
  //     <Card
  //       key={recording.id}
  //       className="mb-4 p-4 max-w-full md:max-w-[50%] mx-auto"
  //     >
  //       <div className="flex flex-col md:flex-row gap-4 items-start">
  //         {/* Media player on the left */}
  //         <div className="w-full md:w-1/2">
  //           {recording.file_type === "video" ? (
  //             <video controls className="w-full rounded-lg">
  //               <source src={recording.file_url} type="video/webm" />
  //               Your browser does not support the video tag.
  //             </video>
  //           ) : (
  //             <audio controls className="w-full  rounded-lg">
  //               <source src={recording.file_url} type="audio/webm" />
  //               Your browser does not support the audio tag.
  //             </audio>
  //           )}
  //         </div>

  //         {/* Note and date on the right */}
  //         <div className="w-full md:w-1/2 max-h-32 overflow-y-auto">
  //           <CardTitle className="text-md mb-1">
  //             {format(localDate, "PPPP")}
  //           </CardTitle>
  //           {recording.note ? (
  //             <p className="text-sm text-white whitespace-pre-line">
  //               {recording.note}
  //             </p>
  //           ) : (
  //             <p className="text-sm text-gray-400 italic">No notes added.</p>
  //           )}
  //         </div>
  //       </div>
  //     </Card>
  //   );
  // };
  const renderRecording = (recording: Recording) => {
    const localDate = toZonedTime(
      recording.created_at,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  
    return (
      <Card
        key={recording.id}
        className="mb-4 p-4 max-w-full md:max-w-[50%] mx-auto"
      >
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* Media player on the left */}
          <div className="w-full md:w-1/2">
            {recording.file_type === "video" ? (
              <video
                controls
                className="w-full rounded-lg"
              >
                <source src={recording.file_url} type="video/webm" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                <audio controls className="w-full">
                  <source src={recording.file_url} type="audio/webm" />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}
          </div>
  
          {/* Note and date on the right */}
          <div className="w-full md:w-1/2">
            <CardTitle className="text-md mb-1">
              {format(localDate, "PPPP")}
            </CardTitle>
            {recording.note ? (
              <p className="text-sm text-white whitespace-pre-line">
                {recording.note}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No notes added.</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row">
      <RecordingDateSidebar
        dates={availableDates}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      <div className=" px-4 py-8">
        {filteredRecordings.length === 0 ? (
          <p className="text-center text-gray-500">
            No recordings for this date.
          </p>
        ) : (
          <div className="w-full">
            {filteredRecordings.map(renderRecording)}
          </div>
        )}
      </div>
    </div>
  );
}
