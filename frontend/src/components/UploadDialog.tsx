import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { useUser } from "@clerk/clerk-react";
import { Progress } from "./ui/progress"; // Add this if using a custom progress component

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: Blob;
  fileType: "audio" | "video";
  onUploadComplete: () => void;
}

export default function UploadDialog({
  isOpen,
  onClose,
  file,
  fileType,
  onUploadComplete,
}: UploadDialogProps) {
  const [note, setNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useUser();
  const typeToSend = fileType;

  const handleUpload = async () => {
    if (!user) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", typeToSend);
    formData.append("user_id", user.id);
    if (note) {
      formData.append("note", note);
    }

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        onUploadComplete();
        onClose();
        window.location.reload(); // Refresh the page after successful upload
      } else {
        console.error("Upload error:", xhr.responseText);
        // Show error to user here
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      console.error("Upload failed due to network error.");
      // Show error to user here
    };

    xhr.open("POST", "http://localhost:8000/recordings/upload");
    xhr.send(formData);

    
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-white">Add Notes and Upload</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            className="text-white"
            placeholder="Add notes about your recording (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {isUploading && (
            <div>
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground mt-2">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
