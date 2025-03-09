import StarBackground from "@/components/StarBackground";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from "axios";



export default function SignInPage() {
  const { getToken } = useAuth();

  useEffect(() => {
    async function updateSignInTime() {
      const token = await getToken();

      if (token) {
        await axios.post("http://localhost:8000/signin", { token });
      }
    }

    updateSignInTime();
  }, []);
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <StarBackground
                safeZone={{ top: 30, bottom: 70, left: 20, right: 80 }}
              />
      <SignIn signUpUrl="/signup" forceRedirectUrl={"/"}/>
    </div>
  );
}
