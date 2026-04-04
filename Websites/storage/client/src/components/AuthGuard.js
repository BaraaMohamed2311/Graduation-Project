"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsLoginContext } from "../contexts/isLogin";

export default function AuthGuard({ children }) {
  const { isLogin } = useIsLoginContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLogin) {
      router.replace("/login");
    }
  }, [isLogin, router]);

  if (!isLogin) return null;

  return children;
}
