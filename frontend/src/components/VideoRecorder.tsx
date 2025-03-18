import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Trash, RefreshCw, Download } from "lucide-react";

interface VideoRecorderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoRecorder({ isOpen, onClose }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Effect to handle dialog open/close
  useEffect(() => {
    if (isOpen) {
      // Reset error state when dialog opens
      setStreamError(null);

      // Always setup a fresh video stream when opening the dialog
      setupVideoStream();
    } else {
      // Clean up resources when dialog closes
      cleanupResources();
    }

    // Cleanup function for component unmount
    return () => {
      cleanupResources();
    };
  }, [isOpen]);

  // Clean up all resources
  const cleanupResources = () => {
    // Stop recording if active
    if (isRecording && mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping recorder:", e);
      }
      setIsRecording(false);
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Release any video URLs
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
  };

  const setupVideoStream = async () => {
    // First clean up any existing resources
    cleanupResources();

    try {
      console.log("Requesting media access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("Media access granted:", stream);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.display = "block";
        videoRef.current.muted = true; // Ensure muted to avoid feedback
        videoRef.current.play().catch((e) => {
          console.error("Error playing video:", e);
          setStreamError("Failed to play video stream");
        });
      }

      // Reset any previous errors
      setStreamError(null);
    } catch (err) {
      console.error("Error accessing camera or microphone:", err);
      setStreamError(
        "Unable to access camera or microphone. Please check your permissions."
      );
    }
  };

  const startRecording = () => {
    // If we have a stream error, try setting up the stream again
    if (streamError) {
      setupVideoStream();
      // If we still have an error, don't proceed
      if (streamError) return;
    }

    if (!streamRef.current) {
      console.error("No media stream available");
      setStreamError("No camera access. Please check your permissions.");
      return;
    }

    videoChunksRef.current = [];
    setVideoURL(null);

    try {
      // Try to create a MediaRecorder with the default MIME type
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("Data available event:", event.data.size);
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log(
          "MediaRecorder stopped, chunks:",
          videoChunksRef.current.length
        );

        if (videoChunksRef.current.length === 0) {
          console.warn("No video data recorded");
          setStreamError("No video data was recorded");
          return;
        }

        try {
          const videoBlob = new Blob(videoChunksRef.current, {
            type: "video/webm",
          });
          console.log("Video blob created:", videoBlob.size);
          const url = URL.createObjectURL(videoBlob);
          console.log("Video URL created:", url);
          setVideoURL(url);

          // Now that we have the video URL, we can safely stop the tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }
        } catch (e) {
          console.error("Error creating video blob:", e);
          setStreamError("Error creating video preview");
        }
      };

      mediaRecorderRef.current.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setStreamError("Error recording video");
      };

      // Start recording with 1000ms timeslice
      mediaRecorderRef.current.start(1000);
      console.log("Recording started");
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start recording:", e);
      setStreamError(
        "Failed to start recording. Your browser may not support this feature."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        console.log("Stopping recorder...");
        mediaRecorderRef.current.stop();
        setIsRecording(false);

        // NOTE: We are NOT stopping the tracks here anymore
        // The tracks will be stopped in the onstop event handler
        // after the video URL has been created

        console.log("Recording stopping process initiated");
      } catch (e) {
        console.error("Error stopping recording:", e);
        setStreamError("Error stopping recording");
        setIsRecording(false);
      }
    }
  };

  const handleSave = () => {
    if (videoURL) {
      // Here you would typically upload the video to your backend
      // For now, we'll just download it locally
      const a = document.createElement("a");
      a.href = videoURL;
      a.download = `video_recording_${new Date().toISOString()}.webm`;
      a.click();
    }
    handleClose();
  };

  const handleDelete = () => {
    // Release the URL to prevent memory leaks
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
      setVideoURL(null);
    }

    // Setup video stream again to show camera
    setupVideoStream();
  };

  const handleReRecord = async () => {
    // Delete the current recording
    if (videoURL) {
      URL.revokeObjectURL(videoURL);
      setVideoURL(null);
    }

    // Always set up a fresh stream
    await setupVideoStream();

    // Only start recording if we have a valid stream
    if (streamRef.current) {
      // Small delay to ensure stream is ready
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  };

  const handleClose = () => {
    cleanupResources();
    setVideoURL(null);
    setStreamError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Video</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {videoURL ? (
            <div className="w-full">
              {/* Video Preview */}
              <div className="w-full mb-4">
                <video
                  key={videoURL} /* Key forces re-render when URL changes */
                  src={videoURL}
                  controls
                  className="w-full rounded-lg min-h-[400px] max-h-[600px] object-contain bg-black"
                  autoPlay
                  playsInline
                />
              </div>

              {/* Action Buttons */}
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
            <div className="w-full">
              {/* Camera Preview */}
              <div className="relative w-full mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-lg border border-gray-300 min-h-[400px] max-h-[600px] object-contain bg-black"
                />
                {isRecording && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                    Recording
                  </div>
                )}
              </div>

              {streamError && (
                <div className="mt-2 text-red-500 text-center text-sm">
                  {streamError}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-4">
            {isRecording ? (
              <Button
                variant="destructive"
                onClick={stopRecording}
                className="flex items-center gap-2"
              >
                <span className="h-3 w-3 rounded-full bg-white animate-pulse"></span>
                Stop Recording
              </Button>
            ) : (
              !videoURL && (
                <Button
                  onClick={startRecording}
                  className="flex items-center gap-2"
                >
                  <span className="h-3 w-3 rounded-full bg-red-500"></span>
                  Start Recording
                </Button>
              )
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={handleClose}>
            Cancel
          </Button>
          {videoURL && (
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Download size={16} />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
