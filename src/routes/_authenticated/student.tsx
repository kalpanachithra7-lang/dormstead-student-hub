import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BedDouble } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, StatusBadge } from "@/components/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/student")({
  head: () => ({ meta: [{ title: "Student Portal — Greenleaf Hostel" }, { name: "description", content: "Your room, complaints and leave requests." }] }),
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (data) throw redirect({ to: "/admin" });
  },
  component: StudentPortal,
});

function StudentPortal() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const uid = user.id;

  const profile = useQuery({ queryKey: ["profile", uid], queryFn: async () => (await supabase.from("profiles").select("*").eq("id", uid).single()).data });
  const room = useQuery({ queryKey: ["myroom", uid], queryFn: async () => (await supabase.from("allocations").select("rooms(room_number, block, capacity)").eq("student_id", uid).maybeSingle()).data });
  const complaints = useQuery({ queryKey: ["mycomplaints", uid], queryFn: async () => (await supabase.from("complaints").select("*").eq("student_id", uid).order("created_at", { ascending: false })).data ?? [] });
  const leaves = useQuery({ queryKey: ["myleaves", uid], queryFn: async () => (await supabase.from("leave_requests").select("*").eq("student_id", uid).order("created_at", { ascending: false })).data ?? [] });

  const [c, setC] = useState({ title: "", description: "" });
  const [l, setL] = useState({ from_date: "", to_date: "", reason: "" });

  async function addComplaint(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("complaints").insert({ ...c, student_id: uid });
    if (error) return toast.error(error.message);
    toast.success("Complaint submitted"); setC({ title: "", description: "" });
    qc.invalidateQueries({ queryKey: ["mycomplaints"] });
  }
  async function addLeave(e: React.FormEvent) {
    e.preventDefault();
    if (l.to_date < l.from_date) return toast.error("End date must be after start date");
    const { error } = await supabase.from("leave_requests").insert({ ...l, student_id: uid });
    if (error) return toast.error(error.message);
    toast.success("Leave request sent"); setL({ from_date: "", to_date: "", reason: "" });
    qc.invalidateQueries({ queryKey: ["myleaves"] });
  }

  const r = room.data?.rooms as { room_number: string; block: string; capacity: number } | undefined;

  return (
    <PortalShell label="Student portal" name={profile.data?.full_name || user.email || ""}>
      <h1 className="mb-6 text-4xl font-bold">Hello, {profile.data?.full_name?.split(" ")[0] || "there"} 👋</h1>
      <div className="mb-8 flex items-center gap-5 rounded-2xl bg-primary p-6 text-primary-foreground">
        <BedDouble className="h-10 w-10 text-accent" />
        {r ? (
          <div><div className="text-sm opacity-80">Your room</div><div className="font-display text-3xl font-bold">{r.room_number}</div><div className="text-sm opacity-80">Block {r.block} · {r.capacity}-sharing</div></div>
        ) : (<div><div className="font-display text-2xl font-bold">No room assigned yet</div><div className="text-sm opacity-80">The admin will allocate your room soon.</div></div>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-2xl font-bold">Raise a complaint</h2>
          <form onSubmit={addComplaint} className="space-y-3">
            <div><Label>Title</Label><Input required value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} placeholder="e.g. Fan not working" /></div>
            <div><Label>Details</Label><Textarea value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} /></div>
            <Button type="submit">Submit</Button>
          </form>
          <ul className="mt-6 divide-y">
            {complaints.data?.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-3">
                <div><div className="font-semibold">{x.title}</div><div className="text-xs text-muted-foreground">{new Date(x.created_at).toLocaleDateString()}</div></div>
                <StatusBadge s={x.status} />
              </li>
            ))}
            {complaints.data?.length === 0 && <li className="py-3 text-sm text-muted-foreground">No complaints yet.</li>}
          </ul>
        </section>

        <section className="rounded-2xl border bg-card p-6">
          <h2 className="mb-4 text-2xl font-bold">Request leave</h2>
          <form onSubmit={addLeave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From</Label><Input type="date" required value={l.from_date} onChange={(e) => setL({ ...l, from_date: e.target.value })} /></div>
              <div><Label>To</Label><Input type="date" required value={l.to_date} onChange={(e) => setL({ ...l, to_date: e.target.value })} /></div>
            </div>
            <div><Label>Reason</Label><Textarea required value={l.reason} onChange={(e) => setL({ ...l, reason: e.target.value })} /></div>
            <Button type="submit">Send request</Button>
          </form>
          <ul className="mt-6 divide-y">
            {leaves.data?.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-3">
                <div><div className="font-semibold">{x.from_date} → {x.to_date}</div><div className="text-xs text-muted-foreground">{x.reason}</div></div>
                <StatusBadge s={x.status} />
              </li>
            ))}
            {leaves.data?.length === 0 && <li className="py-3 text-sm text-muted-foreground">No leave requests yet.</li>}
          </ul>
        </section>
      </div>
    </PortalShell>
  );
}
