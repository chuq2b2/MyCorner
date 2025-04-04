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

interface MediaFile {
  key: string;
  url: string;
  last_modified: string;
  metadata: {
    note?: string;
    original_filename: string;
    content_type: string;
  };
}

export default function MediaList() {
  const [audioFiles, setAudioFiles] = useState<MediaFile[]>([]);
  const [videoFiles, setVideoFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("audio");

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    setIsLoading(true);
    try {
      // Fetch audio files
      const audioResponse = await fetch("/api/media/list/audio");
      const audioData = await audioResponse.json();
      setAudioFiles(audioData.files);

      // Fetch video files
      const videoResponse = await fetch("/api/media/list/video");
      const videoData = await videoResponse.json();
      setVideoFiles(videoData.files);
    } catch (error) {
      console.error("Error fetching media files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMediaFile = (file: MediaFile) => {
    const isVideo = file.metadata.content_type.startsWith("video");
    const date = new Date(file.last_modified);

    return (
      <Card key={file.key} className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">
            {file.metadata.original_filename}
          </CardTitle>
          <CardDescription>{format(date, "PPP 'at' p")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isVideo ? (
            <video controls className="w-full rounded-lg">
              <source src={file.url} type={file.metadata.content_type} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <audio controls className="w-full">
              <source src={file.url} type={file.metadata.content_type} />
              Your browser does not support the audio tag.
            </audio>
          )}
          {file.metadata.note && (
            <p className="mt-2 text-sm text-gray-600">{file.metadata.note}</p>
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
            {audioFiles.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No audio recordings yet
              </p>
            ) : (
              audioFiles.map(renderMediaFile)
            )}
          </div>
        </TabsContent>
        <TabsContent value="video">
          <div className="space-y-4">
            {videoFiles.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No video recordings yet
              </p>
            ) : (
              videoFiles.map(renderMediaFile)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
