import {
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import HomePage from "./pages/HomePage";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();

  return (
    <>
      <SignedOut>
        <div className="flex items-center justify-center h-screen w-full">
          <div className="flex flex-col text-center border-5 border-b-50 p-4 bg-[url(/frame-transparent.png)] bg-center bg-no-repeat">
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
            <div className="p-32">
              <p className="text-5xl mb-5 font-bold">Welcome to MyCorner</p>
              <button onClick={() => navigate("/signin")}>Sign In</button>
              <button onClick={() => navigate("/signup")}>Sign Up</button>
            </div>
          </div>
        </div>
      </SignedOut>

      {/* Logged-in Page (After Login) */}
      <SignedIn>
        <HomePage />
        {/* <UserButton /> */}
      </SignedIn>
    </>
  );
}
