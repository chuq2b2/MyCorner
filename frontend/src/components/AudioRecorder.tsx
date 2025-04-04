import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { uploadMedia } from "../api/media";

interface AudioRecorderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AudioRecorder({ isOpen, onClose }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all audio tracks
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const handleSave = async () => {
    if (!audioURL) return;

    try {
      setIsUploading(true);

      // Convert the audio URL to a File object
      const response = await fetch(audioURL);
      const blob = await response.blob();
      const file = new File([blob], "audio-recording.webm", {
        type: "audio/webm",
      });

      // Upload to S3
      await uploadMedia(file, "audio", note);

      // Close the dialog and reset state
      handleClose();
    } catch (error) {
      console.error("Error saving audio:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Stop recording if it's ongoing
    if (isRecording) {
      stopRecording();
    }

    // Clean up audio URL
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }

    // Reset all state
    setAudioURL(null);
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
          <DialogTitle>Record Audio</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {!audioURL ? (
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className="w-16 h-16 rounded-full p-0"
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          ) : (
            <audio controls src={audioURL} className="w-full" />
          )}

          {audioURL && (
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
          {audioURL && (
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
