"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Clear localStorage memory just to be double safe on the client side
    localStorage.removeItem("mfa_verified");
    router.replace("/auth");
  }, [router]);

  return null;
}
