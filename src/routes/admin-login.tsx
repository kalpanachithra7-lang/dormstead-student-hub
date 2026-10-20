import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Greenleaf Hostel" },
      { name: "description", content: "Admin access to manage rooms, complaints and leave." },
      { property: "og:title", content: "Admin Login — Greenleaf Hostel" },
      { property: "og:description", content: "Admin access to manage rooms, complaints and leave." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); { toast.error(error.message); return; } }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    setBusy(false);
    if (!isAdmin) { await supabase.auth.signOut(); { toast.error("This account is not an admin."); return; } }
    navigate({ to: "/admin" });
  }

  async function setup() {
    if (!email || password.length < 6) { toast.error("Enter the admin email and password first."); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) toast.success("Admin account created. Confirm it from your email inbox, then sign in.");
    else navigate({ to: "/admin" });
  }

  return (
    <AuthCard title="Admin portal" subtitle="Wardens and staff only.">
      <form onSubmit={signIn} className="space-y-4">
        <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button type="submit" className="w-full" disabled={busy}>Sign in as admin</Button>
      </form>
      <button onClick={setup} disabled={busy} className="mt-4 w-full text-center text-xs text-muted-foreground underline">
        First time? Set up the admin account
      </button>
      <p className="mt-2 text-center text-xs"><Link to="/login" className="text-muted-foreground underline">Student login</Link></p>
    </AuthCard>
  );
}
