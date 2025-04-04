import NavBar from "@/components/NavBar";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from "axios";

export default function HomePage() {
  const { user } = useUser();

  useEffect(() => {
    async function syncUserData() {
      if (!user) return;

      try {
        // Get user data from Clerk
        const userData = {
          user_id: user.id,
          created_at: user.createdAt,
          last_sign_in: user.lastSignInAt,
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.imageUrl,
          email: user.emailAddresses[0].emailAddress,
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
      } catch (error) {
        console.error("Failed to sync user data:", error);
      }
    }

    syncUserData();
  }, [user]);

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
