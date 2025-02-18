import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";


export default function App() {
  return (
    <header className="flex flex-col items-center justify-center py-8 px-4">
      <SignedOut>
        <div className="text-9xl border-2 p-9 rounded-lg">Welcome to MyCorner</div>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
