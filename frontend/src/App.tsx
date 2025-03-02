import { SignedIn, SignedOut } from "@clerk/clerk-react";
import HomePage from "./pages/HomePage";
import { useNavigate } from "react-router-dom";
import StarBackground from "./components/StarBackground";
import { Video } from "lucide-react";

export default function App() {
  const navigate = useNavigate();

  return (
    <>
      {/* Logged-out Page (Not Signin) */}
      <SignedOut>
        {/* Background Star Layer */}
        <StarBackground
          safeZone={{ top: 30, bottom: 70, left: 20, right: 80 }}
        />

        <div className="flex items-center justify-center h-screen w-full">
          <div className="flex flex-col text-center border-5 border-b-50 p-4 ">
            <Video fill="red"/>
            <div className="p-8 md:p-32">
              <p className="text-5xl/15 font-bold playwriteAR border-4 p-8 m-2">
                Welcome to MyCorner
              </p>
              <div className="flex flex-col md:flex-row md:justify-center md:gap-5 mt-3">
                <button
                  className="w-2/3 mx-auto md:mx-0 md:w-auto mb-2 md:mb-0"
                  onClick={() => navigate("/signin")}
                >
                  Sign In
                </button>
                <button
                  className="w-2/3 mx-auto md:mx-0 md:w-auto"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      {/* Logged-in Page (After Login) */}
      <SignedIn>
        <HomePage />
      </SignedIn>
    </>
  );
}
