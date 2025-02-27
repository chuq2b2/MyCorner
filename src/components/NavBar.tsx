import { UserButton } from "@clerk/clerk-react";

export default function NavBar() {
  return (
    <nav className="inline-flex items-center rounded-full bg-gray-800 p-4">
      This is the navbar
      <UserButton />
    </nav>
  );
}
