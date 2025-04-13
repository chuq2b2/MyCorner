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
import { useUser, useAuth } from "@clerk/clerk-react";

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
  const { user } = useUser();
  const { getToken } = useAuth();

  const handleUpload = async () => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Get the session token
      const token = await getToken();

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_type", fileType);
      if (note) {
        formData.append("note", note);
      }

      // Upload to backend
      const response = await fetch("http://localhost:8000/recordings/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      onUploadComplete();
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Notes and Upload</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Add notes about your recording (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
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
