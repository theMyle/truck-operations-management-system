"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Center, Loader } from "@mantine/core";
import { UserRole } from "@/types/user";

export default function DefaultPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/");
      return;
    }

    const role = (user.publicMetadata?.role as string) || "";

    switch (role) {
      case UserRole.ADMIN:
        router.replace("/dashboard");
        break;
      case UserRole.DISPATCH_OFFICER:
        router.replace("/dispatch");
        break;
      case UserRole.BILLING_CLERK:
      case UserRole.COORDINATOR:
        router.replace("/trip-logs");
        break;
      default:
        // Fallback if no matching role
        router.replace("/dashboard");
        break;
    }
  }, [user, isLoaded, router]);

  return (
    <Center style={{ height: "100%" }}>
      <Loader size="md" />
    </Center>
  );
}