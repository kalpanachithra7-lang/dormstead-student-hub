import { createFileRoute, Link } from "@tanstack/react-router";
import { BedDouble, MessageSquareWarning, CalendarCheck, ShieldCheck, GraduationCap } from "lucide-react";
import hostel from "@/assets/hostel.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Greenleaf Hostel — Student & Admin Portal" },
      { name: "description", content: "Room allocation, complaints and leave requests for hostel students and admins." },
      { property: "og:title", content: "Greenleaf Hostel — Student & Admin Portal" },
      { property: "og:description", content: "Room allocation, complaints and leave requests in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl font-bold text-primary">Greenleaf Hostel</span>
        <nav className="flex gap-3 text-sm font-semibold">
          <Link to="/login" className="rounded-full px-4 py-2 hover:bg-secondary">Student login</Link>
          <Link to="/admin-login" className="rounded-full bg-primary px-4 py-2 text-primary-foreground">Admin</Link>
        </nav>
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-10 md:grid-cols-2">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Your home on campus</p>
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">Hostel life, neatly organised.</h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            See your room, raise complaints and request leave — while wardens manage everything from one place.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link to="/login" className="group rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <GraduationCap className="mb-3 h-7 w-7 text-primary" />
              <div className="font-display text-xl font-bold">Student portal</div>
              <div className="text-sm text-muted-foreground">Sign in or create account</div>
            </Link>
            <Link to="/admin-login" className="group rounded-2xl bg-primary p-6 text-primary-foreground transition hover:-translate-y-1 hover:shadow-lg">
              <ShieldCheck className="mb-3 h-7 w-7 text-accent" />
              <div className="font-display text-xl font-bold">Admin portal</div>
              <div className="text-sm opacity-80">Warden & staff access</div>
            </Link>
          </div>
        </div>
        <img src={hostel} alt="Hostel courtyard at sunset" width={1280} height={960} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl" />
      </main>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {[
          { icon: BedDouble, t: "Room allocation", d: "Know your room and block instantly." },
          { icon: MessageSquareWarning, t: "Complaints", d: "Report issues and track their status." },
          { icon: CalendarCheck, t: "Leave / outpass", d: "Request leave and get approval online." },
        ].map(({ icon: I, t, d }) => (
          <div key={t} className="rounded-2xl bg-secondary p-6">
            <I className="mb-3 h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold">{t}</h3>
            <p className="text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
