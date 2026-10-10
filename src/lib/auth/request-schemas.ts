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
  activationToken: z.string().min(1),
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine(
    (value) => Boolean(value.fullName?.trim() || value.firstName?.trim() || value.lastName?.trim()),
    "Name is required",
  );
