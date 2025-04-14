import { useState, useEffect } from "react";
import { format } from "date-fns";
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
  const [audioRecordings, setAudioRecordings] = useState<Recording[]>([]);
  const [videoRecordings, setVideoRecordings] = useState<Recording[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
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
        // .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      console.log("Supabase data:", data);
      console.log("Supabase error:", error);
      if (error) throw error;

      const audio = data.filter((r) => r.file_type === "audio");
      const video = data.filter((r) => r.file_type === "video");

      setAudioRecordings(audio);
      setVideoRecordings(video);
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

  const renderRecording = (recording: Recording) => {
    const date = new Date(recording.created_at);

    return (
      <Card key={recording.id} className="mb-4 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* Media player on the left */}
          <div className="w-full md:w-1/2">
            {recording.file_type === "video" ? (
              <video controls className="w-full rounded-lg">
                <source src={recording.file_url} type="video/webm" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <audio controls className="w-full">
                <source src={recording.file_url} type="audio/webm" />
                Your browser does not support the audio tag.
              </audio>
            )}
          </div>

          {/* Note and date on the right */}
          <div className="w-full md:w-1/2">
            <CardTitle className="text-md mb-1">
              {format(date, "PPPPpp")}
            </CardTitle>
            {recording.note ? (
              <p className="text-sm text-gray-700 whitespace-pre-line">
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
    <div className="container mx-auto px-4 py-8">
      {recordings.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          You have no recordings yet.
        </p>
      ) : (
        <div className="space-y-4">{recordings.map(renderRecording)}</div>
      )}
    </div>
  );
}
