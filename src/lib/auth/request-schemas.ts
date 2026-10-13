import { z } from "zod";

export const activationCredentialsSchema = z.object({
  token: z.string().min(1),
  username: z.string().trim().min(2).max(40),
  password: z.string().min(1),
  confirmPassword: z.string().min(1),
});

export const activationTotpSchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
  confirmPassword: z.string().min(1),
});
