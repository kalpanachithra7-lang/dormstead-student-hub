import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 block text-center font-display text-2xl font-bold text-primary">Greenleaf Hostel</Link>
        <div className="rounded-2xl border bg-card p-8 shadow-xl">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
