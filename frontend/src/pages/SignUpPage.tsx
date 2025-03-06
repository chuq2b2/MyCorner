import StarBackground from "@/components/StarBackground";
import { SignUp, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from 'axios';

export default function SignUpPage() {
  const { getToken } = useAuth();

  useEffect(() => {
    async function sendUserData() {
      const token = await getToken();

      if (token) {
        await axios.post("http://localhost:8000/signup", { token });
      }
    }

    sendUserData();
  }, []);
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <StarBackground
                safeZone={{ top: 30, bottom: 70, left: 20, right: 80 }}
              />
      <SignUp signInUrl="/signin" forceRedirectUrl={"/"}/>
    </div>
  );
}
