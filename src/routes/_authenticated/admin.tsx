import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell, StatusBadge } from "@/components/PortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Portal — Greenleaf Hostel" }, { name: "description", content: "Manage rooms, students, complaints and leave." }] }),
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/student" });
  },
  component: AdminPortal,
});

const sel = "rounded-md border bg-card px-2 py-1.5 text-sm";

function AdminPortal() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries();

  const rooms = useQuery({ queryKey: ["rooms"], queryFn: async () => (await supabase.from("rooms").select("*").order("room_number")).data ?? [] });
  const students = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (!ids.length) return [];
      return (await supabase.from("profiles").select("*").in("id", ids).order("full_name")).data ?? [];
    },
  });
  const allocs = useQuery({ queryKey: ["allocs"], queryFn: async () => (await supabase.from("allocations").select("*")).data ?? [] });
  const complaints = useQuery({ queryKey: ["complaints"], queryFn: async () => (await supabase.from("complaints").select("*, profiles(full_name, roll_no)").order("created_at", { ascending: false })).data ?? [] });
  const leaves = useQuery({ queryKey: ["leaves"], queryFn: async () => (await supabase.from("leave_requests").select("*, profiles(full_name, roll_no)").order("created_at", { ascending: false })).data ?? [] });

  const [nr, setNr] = useState({ room_number: "", block: "A", capacity: 2 });

  const occupancy = (roomId: string) => allocs.data?.filter((a) => a.room_id === roomId).length ?? 0;
  const roomOf = (sid: string) => allocs.data?.find((a) => a.student_id === sid)?.room_id ?? "";

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("rooms").insert(nr);
    if (error) { toast.error(error.message); return; }
    setNr({ room_number: "", block: "A", capacity: 2 }); refresh();
  }
  async function delRoom(id: string) {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) { toast.error(error.message); return; } refresh();
  }
  async function assign(sid: string, roomId: string) {
    if (!roomId) { await supabase.from("allocations").delete().eq("student_id", sid); refresh(); return; }
    const room = rooms.data?.find((r) => r.id === roomId);
    if (room && occupancy(roomId) >= room.capacity && roomOf(sid) !== roomId) { toast.error("Room is full"); return; }
    const { error } = await supabase.from("allocations").upsert({ student_id: sid, room_id: roomId }, { onConflict: "student_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Room assigned"); refresh();
  }
  async function setStatus(table: "complaints" | "leave_requests", id: string, status: string) {
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; } refresh();
  }

  const stats = [
    { l: "Students", v: students.data?.length ?? 0 },
    { l: "Rooms", v: rooms.data?.length ?? 0 },
    { l: "Open complaints", v: complaints.data?.filter((c) => c.status !== "resolved").length ?? 0 },
    { l: "Pending leaves", v: leaves.data?.filter((c) => c.status === "pending").length ?? 0 },
  ];

  return (
    <PortalShell label="Admin portal" name={user.email ?? ""}>
      <h1 className="mb-6 text-4xl font-bold">Dashboard</h1>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl border bg-card p-5">
            <div className="font-display text-3xl font-bold text-primary">{s.v}</div>
            <div className="text-sm text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="leaves">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="rounded-2xl border bg-card p-6">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Name</th><th>Roll no.</th><th>Email</th><th>Phone</th><th>Room</th></tr></thead>
            <tbody className="divide-y">
              {students.data?.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 font-semibold">{s.full_name || "—"}</td><td>{s.roll_no}</td><td>{s.email}</td><td>{s.phone}</td>
                  <td>
                    <select className={sel} value={roomOf(s.id)} onChange={(e) => assign(s.id, e.target.value)}>
                      <option value="">Not assigned</option>
                      {rooms.data?.map((r) => <option key={r.id} value={r.id}>{r.room_number} ({occupancy(r.id)}/{r.capacity})</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.data?.length === 0 && <p className="py-4 text-sm text-muted-foreground">No students registered yet.</p>}
        </TabsContent>

        <TabsContent value="rooms" className="rounded-2xl border bg-card p-6">
          <form onSubmit={addRoom} className="mb-6 flex flex-wrap items-end gap-3">
            <Input className="w-36" placeholder="Room no." required value={nr.room_number} onChange={(e) => setNr({ ...nr, room_number: e.target.value })} />
            <Input className="w-24" placeholder="Block" required value={nr.block} onChange={(e) => setNr({ ...nr, block: e.target.value })} />
            <Input className="w-24" type="number" min={1} required value={nr.capacity} onChange={(e) => setNr({ ...nr, capacity: Number(e.target.value) })} />
            <Button type="submit">Add room</Button>
          </form>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.data?.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-secondary p-4">
                <div><div className="font-display text-xl font-bold">{r.room_number}</div><div className="text-xs text-muted-foreground">Block {r.block} · {occupancy(r.id)}/{r.capacity} occupied</div></div>
                <Button variant="ghost" size="icon" onClick={() => delRoom(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="complaints" className="rounded-2xl border bg-card p-6">
          <ul className="divide-y">
            {complaints.data?.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="font-semibold">{c.title} <StatusBadge s={c.status} /></div>
                  <div className="text-sm text-muted-foreground">{c.description}</div>
                  <div className="text-xs text-muted-foreground">{c.profiles?.full_name} · {c.profiles?.roll_no} · {new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <select className={sel} value={c.status} onChange={(e) => setStatus("complaints", c.id, e.target.value)}>
                  <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option>
                </select>
              </li>
            ))}
            {complaints.data?.length === 0 && <li className="py-3 text-sm text-muted-foreground">No complaints.</li>}
          </ul>
        </TabsContent>

        <TabsContent value="leaves" className="rounded-2xl border bg-card p-6">
          <ul className="divide-y">
            {leaves.data?.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="font-semibold">{l.profiles?.full_name} · {l.from_date} → {l.to_date} <StatusBadge s={l.status} /></div>
                  <div className="text-sm text-muted-foreground">{l.reason}</div>
                </div>
                {l.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setStatus("leave_requests", l.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => setStatus("leave_requests", l.id, "rejected")}>Reject</Button>
                  </div>
                )}
              </li>
            ))}
            {leaves.data?.length === 0 && <li className="py-3 text-sm text-muted-foreground">No leave requests.</li>}
          </ul>
        </TabsContent>
      </Tabs>
    </PortalShell>
  );
}
