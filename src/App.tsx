import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

export default function App() {
  return (
    <>
      <SignedOut>
        <div className="flex items-center justify-center h-screen w-full">
          <div className="flex flex-col text-center border-5 border-b-50 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="red"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-video items-end"
            >
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
              <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
            <div className="p-32">
              <p className="text-5xl mb-5 font-bold">Welcome to MyCorner</p>
              <SignInButton />
            </div>
          </div>
        </div>
      </SignedOut>

      {/* Logged-in Page (After Login) */}
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
