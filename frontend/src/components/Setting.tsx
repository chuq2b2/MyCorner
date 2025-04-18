import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/clerk-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface SettingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Setting({ isOpen, onClose }: SettingProps) {
  const { user } = useUser();
  const [reminderTime, setReminderTime] = useState("09:00");
  const [enableWeeklyReminder, setEnableWeeklyReminder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReminderSettings();
    }
  }, [user]);

  const fetchReminderSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("reminder_time, enable_weekly_reminder")
        .eq("user_id", user?.id);

      if (error) throw error;

      if (data && data.length > 0) {
        // If you expect multiple rows, you need to pick which one to use
        const setting = data[0]; // Example: just pick the first one for now

        setReminderTime(setting.reminder_time);
        setEnableWeeklyReminder(setting.enable_weekly_reminder || false);
      }
    } catch (error) {
      console.error("Error fetching reminder settings:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("user_settings").upsert(
        [
          {
            user_id: user.id,
            reminder_time: reminderTime,
            enable_weekly_reminder: enableWeeklyReminder,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "user_id" }
      );

      if (error) throw error;

      onClose();
    } catch (error) {
      console.error("Error saving reminder settings:", error);
      alert("Failed to save reminder settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white">Settings</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-white">
          Set a reminder to log into your MyCorner
        </DialogDescription>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminder-time" className="text-right text-white">
              Daily Reminder Time
            </Label>
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReminderTime(e.target.value)
              }
              className="col-span-3 text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weekly-reminder" className="text-right text-white">
              Weekly Reminder
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="weekly-reminder"
                checked={enableWeeklyReminder}
                onCheckedChange={(checked: boolean) =>
                  setEnableWeeklyReminder(checked)
                }
              />
              <Label htmlFor="weekly-reminder" className="text-white">
                Send reminder after 7 days of inactivity
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
