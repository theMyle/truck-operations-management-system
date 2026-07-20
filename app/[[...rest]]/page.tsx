"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import logoImg from "../assets/logo.png";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/default");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 relative">

      {(!isLoaded || isSignedIn) && (
        <div className="absolute inset-0 bg-slate-50 z-50 flex items-center justify-center">
          {/* Show a loading spinner during checking or redirection */}
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
        </div>
      )}

      {/* Brand Header */}
      <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center overflow-hidden p-1.5 shadow-sm">
          <Image
            src={logoImg}
            alt="KRISDOMINGO TRUCKING SERVICES Logo"
            className="object-contain"
          />
        </div>
        <span className="text-slate-800 font-bold tracking-wider text-xs sm:text-sm">
          KRISDOMINGO - Truck Operations Management System
        </span>
      </div>

      {/* Left side: Image container (60% ratio via flex-6) */}
      <div className="hidden lg:flex lg:flex-6 items-center justify-center p-8">
        <div className="relative h-[75%] w-[90%] rounded-2xl overflow-hidden border border-slate-100/50">
          <Image
            src="/login-image-placeholder.jpg"
            alt="Truck"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>

      {/* Right side: Login Form (40% ratio via flex-4, matching background) */}
      <div className="flex w-full items-center justify-center lg:flex-4 p-8">
        <div className="w-full max-w-[380px] flex items-center justify-center">
          <SignIn
            routing="path"
            path="/"
            fallbackRedirectUrl={"/default"}
          />
        </div>
      </div>
    </div>
  );
}
