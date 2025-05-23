import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Card, CardTitle } from "./ui/card";
import { Loader2, Tag, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/clerk-react";
import MediaLayout from "./layouts/MediaLayout";

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
  tags: string[] | null;
  created_at: string;
}

export default function MediaList() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      fetchRecordings();
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

      if (error) throw error;

      const audio = data.filter((r) => r.file_type === "audio");
      const video = data.filter((r) => r.file_type === "video");

      setRecordings(
        [...audio, ...video].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    let filtered = recordings;
  
    if (selectedDate) {
      filtered = filtered.filter((r) => {
        const localDate = toZonedTime(r.created_at, timezone);
        return format(localDate, "yyyy-MM-dd") === selectedDate;
      });
    }
  
    if (selectedTag) {
      filtered = filtered.filter((r) => r.tags?.includes(selectedTag));
    }
  
    setFilteredRecordings(filtered);
  }, [selectedDate, selectedTag, recordings]);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const availableDates = Array.from(
    new Set(
      recordings.map((r) =>
        format(toZonedTime(r.created_at, timezone), "yyyy-MM-dd")
      )
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const handleDeleteRecording = async (recording: Recording) => {
    try {
      // Delete from storage
      const filePath = recording.file_url.split("/").pop();
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("recordings")
          .remove([filePath]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("recordings")
        .delete()
        .eq("id", recording.id);

      if (dbError) throw dbError;

      // Update local state
      setRecordings((prev) => prev.filter((r) => r.id !== recording.id));
      setFilteredRecordings((prev) =>
        prev.filter((r) => r.id !== recording.id)
      );
    } catch (error) {
      console.error("Error deleting recording:", error);
    }
  };

  const renderRecording = (recording: Recording) => {
    const localDate = toZonedTime(
      recording.created_at,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );

    return (
      <Card key={recording.id} className="mb-4 p-4 mx-8 bg-amber-50 relative">
        <button
          className="absolute right-2 top-2 bg-amber-50 hover:bg-red-300"
          onClick={() => handleDeleteRecording(recording)}
        >
          <X className="h-4 w-4 text-black" />
        </button>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* Media player on the left */}
          <div className="w-full md:w-1/2 ">
            {recording.file_type === "video" ? (
              <div className="aspect-video w-full max-w-xl rounded overflow-hidden">
                <video controls className="w-full h-full object-cover">
                  <source src={recording.file_url} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="w-full bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                <audio controls className="max-w-full">
                  <source src={recording.file_url} type="audio/webm" />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}
          </div>

          {/* Note and date on the right */}
          <div className="w-full md:w-1/2">
            <CardTitle className="text-md mb-1 text-center md:text-left text-black">
              {format(localDate, "PPPP")}
            </CardTitle>
            {recording.note ? (
              <p className="text-sm whitespace-pre-line md:text-left text-center text-black">
                {recording.note}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No notes added.</p>
            )}
            {recording.tags && recording.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {recording.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-200 text-black text-xs font-medium"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
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
    <MediaLayout
      dates={availableDates}
      selectedDate={selectedDate}
      selectedTag={selectedTag}
      onDateSelect={setSelectedDate}
      onTagSelect={setSelectedTag}
    >
      <div className="px-4 py-8">
        {filteredRecordings.length === 0 ? (
          <p className="text-center text-gray-500">
            No recordings for this tag.
          </p>
        ) : (
          <div className="w-full">
            {filteredRecordings.map(renderRecording)}
          </div>
        )}
      </div>
    </MediaLayout>
  );
}
