import { useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Trash, RefreshCw, Download, Upload } from "lucide-react";
import UploadDialog from "./UploadDialog";

interface AudioRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

export default function AudioRecorder({
  isOpen,
  onClose,
  onUploadComplete,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioURL(null);
    setRecordingError(null);
    setRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try to use a widely supported format
      let mimeType = "audio/webm";

      // Create MediaRecorder with the appropriate MIME type
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
        console.log("Using MIME type:", mimeType);
      } catch (e) {
        console.warn(
          "MediaRecorder could not be created with specified MIME type. Using default type instead."
        );
        mediaRecorderRef.current = new MediaRecorder(stream);
        console.log(
          "Using default MIME type:",
          mediaRecorderRef.current.mimeType
        );
      }

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        try {
          if (audioChunksRef.current.length === 0) {
            setRecordingError("No audio data was recorded");
            return;
          }

          // Get the actual MIME type from the MediaRecorder
          const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
          console.log("Final MIME type for blob:", mimeType);

          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });

          console.log("Audio blob created, size:", audioBlob.size);
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
        } catch (e) {
          console.error("Error creating audio blob:", e);
          setRecordingError("Error creating audio preview");
        }
      };

      // Start timer for recording duration
      let startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      // Start recording with a timeslice to get frequent ondataavailable events
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setRecordingError(
        "Unable to access your microphone. Please check your device settings."
      );
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

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleUpload = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      setShowUploadDialog(true);
    }
  };

  const handleDownload = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audio_recording_${new Date().toISOString()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = () => {
    // Release the URL to prevent memory leaks
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
  };

  const handleReRecord = () => {
    // Delete the current recording and start a new one
    handleDelete();
    startRecording();
  };

  const handleClose = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioURL(null);
    setRecordingDuration(0);
    setRecordingError(null);
    onClose();
  };

  // Format seconds to mm:ss
  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Record Audio</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            {isRecording ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-32 w-32 rounded-full bg-red-500 animate-pulse flex flex-col items-center justify-center">
                  <span className="text-white font-bold">Recording...</span>
                  <span className="text-white text-sm mt-1">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
                <Button variant="destructive" onClick={stopRecording}>
                  Stop Recording
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {audioURL ? (
                  <div className="w-full max-w-xs">
                    <audio src={audioURL} controls className="w-full" />
                    {recordingError && (
                      <div className="mt-2 text-red-500 text-center text-sm">
                        {recordingError}
                      </div>
                    )}
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={handleReRecord}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Record Again
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        className="flex items-center gap-2"
                      >
                        <Trash size={16} />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Ready</span>
                  </div>
                )}

                {recordingError && !audioURL && (
                  <div className="text-red-500 text-center text-sm">
                    {recordingError}
                  </div>
                )}

                {!audioURL && (
                  <Button onClick={startRecording}>Start Recording</Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button variant="outline" onClick={handleClose} className="w-auto">
              Cancel
            </Button>
            {audioURL && (
              <>
                <Button
                  size="icon"
                  onClick={handleDownload}
                  className="flex items-center gap-2 sm:w-auto"
                >
                  <Download size={16} />
                </Button>
                <Button onClick={handleUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showUploadDialog && audioChunksRef.current.length > 0 && (
        <UploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          file={new Blob(audioChunksRef.current, { type: "audio/webm" })}
          fileType="audio"
          onUploadComplete={() => {
            onUploadComplete?.();
            handleClose();
          }}
        />
      )}
    </>
  );
}
