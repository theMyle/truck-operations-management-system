import { SignIn } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center">
      <SignIn
        routing="hash"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
