import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function PortalShell({ label, name, children }: { label: string; name: string; children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function out() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }
  return (
    <div className="min-h-screen">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="font-display text-xl font-bold">Greenleaf Hostel</div>
            <div className="text-xs uppercase tracking-widest text-accent">{label}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm opacity-80 sm:inline">{name}</span>
            <Button variant="secondary" size="sm" onClick={out}><LogOut className="h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

export function StatusBadge({ s }: { s: string }) {
  const cls =
    s === "resolved" || s === "approved" ? "bg-success text-primary-foreground"
    : s === "rejected" ? "bg-destructive text-destructive-foreground"
    : s === "in_progress" ? "bg-accent text-accent-foreground"
    : "bg-secondary text-secondary-foreground";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>{s.replace("_", " ")}</span>;
}
