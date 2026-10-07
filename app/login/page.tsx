import type { Metadata } from 'next';
import { Brand } from '@/components/Brand';
import { LoginForm } from '@/components/LoginForm';
export const metadata: Metadata = { title: 'Log in' };
export default function LoginPage() {
  return <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
    <div className="mb-10"><Brand /></div>
    <section className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-[0_12px_48px_-20px_rgba(30,45,90,0.2)] sm:p-9">
      <div className="mb-8"><p className="eyebrow mb-3 text-primary">Your workspace</p><h1 className="text-3xl font-semibold tracking-tight">Welcome back.</h1><p className="mt-3 text-base text-muted-foreground">Log in to see your projects and assigned work.</p></div><LoginForm />
      <p className="mt-7 border-t pt-5 text-center text-sm leading-relaxed text-muted-foreground">Use your assigned NovaWorks account.<br />Need access? Contact your administrator.</p>
    </section><p className="mt-8 text-sm text-muted-foreground">NovaWorks Technologies · Lahore, Pakistan</p>
  </main>;
}
