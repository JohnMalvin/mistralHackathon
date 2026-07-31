import { z } from "zod";

export const RegisterSchema = z.object({
	username: z.string().min(3).max(30),
	email: z.email(),
	password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
