import NavBar from "@/components/NavBar";
import { useUser } from "@clerk/clerk-react";
import APITest from "./APITest";

export default function HomePage() {
  const { user } = useUser();

  console.log("Clerk User:", user);


  return (
    <div className="w-full flex flex-col items-center justify-center">
      <NavBar />
      <div className="text-5xl m-10 font-bold"> Welcome {user?.firstName} to MyCorner</div>
      <p>Start Your Video Journal Journey Here</p>
    </div>
  );
}
