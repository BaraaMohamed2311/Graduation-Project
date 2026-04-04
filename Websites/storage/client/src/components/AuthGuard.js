"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useIsLoginContext } from "../contexts/isLogin";

export default function AuthGuard({ children }) {
  const { isLogin } = useIsLoginContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Still reading localStorage — do nothing yet
    if (isLogin === null) return;

    // Not logged in and not already on /login — redirect
    if (!isLogin && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isLogin, pathname, router]);

  // Still hydrating — render nothing to avoid flash or premature redirect
  if (isLogin === null) return null;

  // Not logged in — render nothing while redirect is in flight
  if (!isLogin) return null;

  return children;
}