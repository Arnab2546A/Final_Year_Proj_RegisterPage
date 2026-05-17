"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // By default, the root path redirects to the auth page.
    // The middleware will automatically forward to /register if already verified.
    router.replace("/auth");
  }, [router]);

  return null;
}
