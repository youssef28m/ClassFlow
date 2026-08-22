import { CalendarDays } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-32">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CalendarDays className="size-8" aria-hidden />
      </div>
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          ClassFlow
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Center management system — frontend scaffold. UI coming soon.
        </p>
      </div>
      <span className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-card-foreground shadow-sm">
        Tailwind is active
      </span>
    </main>
  );
}
