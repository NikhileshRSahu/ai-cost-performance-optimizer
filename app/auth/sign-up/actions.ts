'use server';
import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export async function signUpWithEmail(_prev: { error: string } | null, formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (!name || !email || !password) return { error: 'Name, email, and password are required.' };
  if (password.length < 12) return { error: 'Use at least 12 characters for your password.' };
  const { error } = await auth.signUp.email({ name, email, password });
  if (error) return { error: error.message || 'Account creation failed. Try another email.' };
  redirect('/onboarding');
}
