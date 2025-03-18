import { useState } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Plus, Mic, Video } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import VideoRecorder from "./VideoRecorder";

export default function NavBar() {
  const { user } = useUser();
  const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  return (
    <nav className="w-2/3 flex items-center justify-between mt-2 bg-black px-6 py-3 rounded-full">
      <div className="text-white text-xl font-bold">{user?.username}'s MyCorner</div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsAudioDialogOpen(true)}>
              <Mic className="mr-2 h-4 w-4" />
              <span>Audio Recording</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsVideoDialogOpen(true)}>
              <Video className="mr-2 h-4 w-4" />
              <span>Video Recording</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <UserButton />
      </div>

      {/* Audio Recorder Dialog */}
      <AudioRecorder
        isOpen={isAudioDialogOpen}
        onClose={() => setIsAudioDialogOpen(false)}
      />

      {/* Video Recorder Dialog */}
      <VideoRecorder
        isOpen={isVideoDialogOpen}
        onClose={() => setIsVideoDialogOpen(false)}
      />
    </nav>
  );
}
