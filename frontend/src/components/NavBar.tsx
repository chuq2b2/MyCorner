import { useState } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Plus, Mic, Video, BookOpenText, Menu } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import VideoRecorder from "./VideoRecorder";
import PromptGenerator from "./PromptGenerator";

export default function NavBar() {
  const { user } = useUser();
  const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isPromptGeneratorOpen, setIsPromptGeneratorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full sm:w-2/3 flex items-center justify-between bg-gray-900 sm:rounded-full px-4 sm:px-6 py-3 max-w-screen-lg mx-auto">
      <div className="text-white text-base font-bold sm:w-0 ">MyCorner</div>

      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden sm:flex items-center gap-4">
        <Button
          variant="secondary"
          className="flex items-center gap-2"
          onClick={() => setIsPromptGeneratorOpen(true)}
        >
          <BookOpenText size={16} />
          <span>Prompt Generator</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              <span>Create</span>
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

      {/* Mobile Navigation - Visible only on small screens */}
      <div className="flex sm:hidden items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={() => setIsPromptGeneratorOpen(true)}
        >
          <BookOpenText size={18} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Plus size={18} />
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

      {/* Prompt Generator Dialog */}
      <PromptGenerator
        isOpen={isPromptGeneratorOpen}
        onClose={() => setIsPromptGeneratorOpen(false)}
      />
    </nav>
  );
}
