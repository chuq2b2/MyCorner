import StarBackground from "@/components/StarBackground";
import { SignIn } from "@clerk/clerk-react";


export default function SignInPage() {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <StarBackground safeZone={{ top: 30, bottom: 70, left: 20, right: 80 }} />
      <SignIn signUpUrl="/signup" forceRedirectUrl={"/"} />
    </div>
  );
}
