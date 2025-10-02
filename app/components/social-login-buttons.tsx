"use client";

import { useState } from "react";
import { useAuthenticate } from "@account-kit/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SocialLoginButtonProps {
  provider: "google" | "facebook" | "apple";
  className?: string;
}

const providerConfig = {
  google: {
    name: "Google",
    icon: "🚀", // You can replace with actual Google icon
    bgColor: "bg-white hover:bg-gray-50 border border-gray-300",
    textColor: "text-gray-700",
  },
  facebook: {
    name: "Facebook",
    icon: "📘", // You can replace with actual Facebook icon
    bgColor: "bg-[#1877F2] hover:bg-[#166fe5]",
    textColor: "text-white",
  },
  apple: {
    name: "Apple",
    icon: "🍎", // You can replace with actual Apple icon
    bgColor: "bg-black hover:bg-gray-800",
    textColor: "text-white",
  },
};

export function SocialLoginButton({ provider, className }: SocialLoginButtonProps) {
  const { authenticate, isPending } = useAuthenticate();
  const [isLoading, setIsLoading] = useState(false);
  const config = providerConfig[provider];

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await authenticate(
        {
          type: "oauth",
          authProviderId: provider,
          mode: "popup",
        },
        {
          onSuccess: () => {
            console.log(`${config.name} login successful!`);
            setIsLoading(false);
          },
          onError: (error) => {
            console.error(`${config.name} login error:`, error);
            setIsLoading(false);
          },
        }
      );
    } catch (error) {
      console.error(`${config.name} login error:`, error);
      setIsLoading(false);
    }
  };

  const loading = isPending || isLoading;

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleLogin}
      disabled={loading}
      className={cn(
        "w-full h-12 text-base font-medium transition-all duration-200",
        config.bgColor,
        config.textColor,
        "hover:shadow-md disabled:opacity-50",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
          Connecting...
        </>
      ) : (
        <>
          <span className="mr-3 text-xl">{config.icon}</span>
          Continue with {config.name}
        </>
      )}
    </Button>
  );
}

export function SocialLoginButtons({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <SocialLoginButton provider="google" />
      <SocialLoginButton provider="facebook" />
      <SocialLoginButton provider="apple" />
    </div>
  );
}