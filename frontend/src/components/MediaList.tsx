import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("audio");
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchRecordings();
    }
  }, [user]);

  const fetchRecordings = async () => {
    if (!user) return;

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

      setAudioRecordings(audio);
      setVideoRecordings(video);
    } catch (error) {
      console.error("Error fetching recordings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRecording = (recording: Recording) => {
    const date = new Date(recording.created_at);

    return (
      <Card key={recording.id} className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">
            {recording.file_type === "audio"
              ? "Audio Recording"
              : "Video Recording"}
          </CardTitle>
          <CardDescription>{format(date, "PPP 'at' p")}</CardDescription>
        </CardHeader>
        <CardContent>
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
          {recording.note && (
            <p className="mt-2 text-sm text-gray-600">{recording.note}</p>
          )}
        </CardContent>
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audio">Audio Recordings</TabsTrigger>
          <TabsTrigger value="video">Video Recordings</TabsTrigger>
        </TabsList>
        <TabsContent value="audio">
          <div className="space-y-4">
            {audioRecordings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No audio recordings yet
              </p>
            ) : (
              audioRecordings.map(renderRecording)
            )}
          </div>
        </TabsContent>
        <TabsContent value="video">
          <div className="space-y-4">
            {videoRecordings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No video recordings yet
              </p>
            ) : (
              videoRecordings.map(renderRecording)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
