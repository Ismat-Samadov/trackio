// src/lib/actions.ts
"use server"

import { signIn, signOut } from "@/lib/auth"

export async function signInWithGoogle() {
  await signIn("google")
}

export async function signOutAction() {
  await signOut()
}