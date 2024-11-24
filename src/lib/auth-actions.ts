// src/lib/auth-actions.ts
"use server"

import { signIn, signOut } from "@/lib/auth"

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" })
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
