import type { SocialPlatform } from "@/lib/apollo/generated/graphql";

export const SOCIAL_PLATFORMS = [
  { platform: "FACEBOOK", label: "Facebook" },
  { platform: "TELEGRAM", label: "Telegram" },
  { platform: "YOUTUBE", label: "YouTube" },
  { platform: "TIKTOK", label: "TikTok" },
  { platform: "INSTAGRAM", label: "Instagram" },
  { platform: "X", label: "X" },
  { platform: "LINKEDIN", label: "LinkedIn" },
] as const satisfies readonly { platform: SocialPlatform; label: string }[];
