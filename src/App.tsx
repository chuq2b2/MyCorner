import { SignedIn, SignedOut } from "@clerk/clerk-react";
import HomePage from "./pages/HomePage";
import { useNavigate } from "react-router-dom";
import StarBackground from "./components/StarBackground";

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
          {/* md:bg-[url(/frame-transparent.png)] md:bg-center md:bg-no-repeat  */}
          <div className="flex flex-col text-center border-5 border-b-50 p-4 ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="red"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-video items-end"
            >
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
              <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
            <div className="p-8 md:p-32">
              <p className="text-5xl font-bold playwriteAR border-4 p-8">
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
