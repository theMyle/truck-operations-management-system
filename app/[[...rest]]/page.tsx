import { SignIn } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center">
      <SignIn
        routing="path"
        path="/"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
