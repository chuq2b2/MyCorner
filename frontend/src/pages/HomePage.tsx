import NavBar from "@/components/NavBar";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from "axios";

export default function HomePage() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    async function syncUserData() {
      if (!user || !isLoaded) return;

      // // Create a unique key for this user session to prevent duplicate syncs
      // const syncKey = `sync_${user.id}_${new Date().toDateString()}`;

      // // Check if we've already synced for this user session
      // if (localStorage.getItem(syncKey)) {
      //   console.log("User already synced today, skipping");
      //   return;
      // }

      try {
        // Get user data from Clerk
        const userData = {
          user_id: user.id,
          created_at: user.createdAt,
          last_sign_in: user.lastSignInAt, // Clerk provides this timestamp
        };

        // Sync with Supabase
        const response = await axios.post(
          "http://localhost:8000/sync-user",
          userData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("User data synced:", response.data);

        // Mark as synced in localStorage
        // localStorage.setItem(syncKey, "true");
      } catch (error) {
        console.error("Failed to sync user data:", error);
      }
    }

    syncUserData();
  }, [user, isLoaded]); // Re-run when user object or loading state changes

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <NavBar />
      <div className="text-5xl m-10 font-bold">
        {" "}
        Welcome {user?.username} to MyCorner
      </div>
      <p>Start Your Video Journal Journey Here</p>
    </div>
  );
}
