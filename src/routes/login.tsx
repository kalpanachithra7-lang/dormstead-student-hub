import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Student Login — Greenleaf Hostel" },
      { name: "description", content: "Sign in or create your hostel student account." },
      { property: "og:title", content: "Student Login — Greenleaf Hostel" },
      { property: "og:description", content: "Sign in or create your hostel student account." },
    ],
  }),
  component: StudentLogin,
});

function StudentLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ email: "", password: "", full_name: "", roll_no: "", phone: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email: f.email, password: f.password,
          options: { emailRedirectTo: window.location.origin + "/student", data: { full_name: f.full_name, roll_no: f.roll_no, phone: f.phone } },
        });
        if (error) throw error;
        if (!data.session) { toast.success("Check your email to confirm your account."); setMode("in"); return; }
        navigate({ to: "/student" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
        if (error) throw error;
        navigate({ to: "/student" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <AuthCard title={mode === "in" ? "Student sign in" : "Create student account"} subtitle="Access your room, complaints and leave requests.">
      <form onSubmit={submit} className="space-y-4">
        {mode === "up" && (
          <>
            <div><Label>Full name</Label><Input required value={f.full_name} onChange={set("full_name")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Roll no.</Label><Input required value={f.roll_no} onChange={set("roll_no")} /></div>
              <div><Label>Phone</Label><Input value={f.phone} onChange={set("phone")} /></div>
            </div>
          </>
        )}
        <div><Label>Email</Label><Input type="email" required value={f.email} onChange={set("email")} /></div>
        <div><Label>Password</Label><Input type="password" required minLength={6} value={f.password} onChange={set("password")} /></div>
        <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "in" ? "New here? " : "Already registered? "}
        <button className="font-semibold text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Create an account" : "Sign in"}
        </button>
      </p>
      <p className="mt-2 text-center text-xs"><Link to="/admin-login" className="text-muted-foreground underline">Admin login</Link></p>
    </AuthCard>
  );
}
