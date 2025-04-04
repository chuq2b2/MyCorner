import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Video, Square, Loader2 } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { uploadMedia } from "../api/media";

interface VideoRecorderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoRecorder({ isOpen, onClose }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      // Show preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(videoBlob);
        setVideoURL(videoUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handleSave = async () => {
    if (!videoURL) return;

    try {
      setIsUploading(true);

      // Convert the video URL to a File object
      const response = await fetch(videoURL);
      const blob = await response.blob();
      const file = new File([blob], "video-recording.webm", {
        type: "video/webm",
      });

      // Upload to S3
      await uploadMedia(file, "video", note);

      // Close the dialog and reset state
      handleClose();
    } catch (error) {
      console.error("Error saving video:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Stop recording if it's ongoing
    if (isRecording) {
      stopRecording();
    }

    // Clean up video URL
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }

    // Stop the stream if it exists
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Reset all state
    setVideoURL(null);
    setNote("");
    setIsRecording(false);
    setIsUploading(false);

    // Call the parent's onClose
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Video</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {!videoURL ? (
            <>
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                className="w-16 h-16 rounded-full p-0"
              >
                {isRecording ? (
                  <Square className="h-6 w-6" />
                ) : (
                  <Video className="h-6 w-6" />
                )}
              </Button>
            </>
          ) : (
            <video controls src={videoURL} className="w-full rounded-lg" />
          )}

          {videoURL && (
            <Textarea
              placeholder="Add a note about this recording..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full"
            />
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {videoURL && (
            <Button onClick={handleSave} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Recording"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
