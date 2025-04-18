import { ReactNode, useState } from "react";
import RecordingDateSidebar from "../RecordingDateSideBar";
import { Menu } from "lucide-react";
import { Button } from "../ui/button";

interface MediaLayoutProps {
  children: ReactNode;
  dates: string[];
  selectedDate: string | null;
  selectedTag: string | null;
  onDateSelect: (date: string | null) => void;
  onTagSelect: (tag: string | null) => void;
}

export default function MediaLayout({
  children,
  dates,
  selectedDate,
  selectedTag,
  onDateSelect,
  onTagSelect,
}: MediaLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const hasContent = Boolean(children);
  return (
    <div className="flex h-screen relative">
      {/* Mobile Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden absolute left-4 top-6 z-50"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar */}

      <div
        className={`w-72 mt-4 h-[calc(100vh-4rem)] border-r bg-amber-100 transform transition-transform duration-200 ease-in-out z-40
      absolute md:relative
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-[200%]"} md:translate-x-0`}
      >
        <RecordingDateSidebar
          dates={dates}
          selectedDate={selectedDate}
          selectedTag={selectedTag}
          onDateSelect={onDateSelect}
          onTagSelect={onTagSelect}
        />
      </div>

      {/* Content */}
      {hasContent && (
      <div className="flex-1 overflow-auto pt-4">
        <div className="max-w-7xl mx-auto px-4">{children}</div>
      </div>
      )}
    </div>
  );
}
