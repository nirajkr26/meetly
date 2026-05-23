import Link from "next/link";
import { Calendar, Clock, Shield, Globe, LayoutDashboard, ArrowRight, } from "lucide-react";
import { MeetlyLogo } from "@/components/meetly-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Meetly - Professional Scheduling",
  description: "Schedule meetings with automated availability, timezone support, and double-booking protection.",
};

const features = [
  {
    icon: Shield,
    title: "Double-booking protection",
    description: "Overlapping bookings are blocked at the API and database level so slots stay conflict-free.",
  },
  {
    icon: Globe,
    title: "Timezone-aware scheduling",
    description: "Invitees pick times in their zone while hosts keep availability in theirs.",
  },
  {
    icon: LayoutDashboard,
    title: "Full admin control",
    description: "Manage event types, weekly hours, and upcoming meetings from one dashboard.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <MeetlyLogo />
          <Button asChild size="sm">
            <Link href="/dashboard/event-types">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6">
              <Badge variant="secondary" className="w-fit">
                Professional scheduling
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:leading-tight">
                Scheduling that feels like{" "}
                <span className="text-primary">Calendly</span>, built for Meetly
              </h1>
              <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
                Share booking links, let invitees pick a time, and manage
                everything from a clean admin dashboard — with timezone support
                and conflict-safe bookings.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/dashboard/event-types">
                    Open dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Link href="/dashboard/meetings">View meetings</Link>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t pt-6">
                {[
                  { label: "Safe", value: "No overlaps" },
                  { label: "Fast", value: "Live slots" },
                  { label: "Simple", value: "One link" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-sm font-semibold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview card */}
            <Card className="mx-auto w-full max-w-md shadow-lg">
              <CardHeader className="border-b pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    30m
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      30 Minute Project Sync
                    </CardTitle>
                    <CardDescription>Hosted by Niraj Kumar</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex gap-3 text-sm">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Monday, May 25, 2026</p>
                    <p className="text-muted-foreground">
                      10:00 AM – 10:30 AM (IST)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">Niraj Kumar</p>
                    <p className="text-muted-foreground">nirajkumargupta2642006@gmail.com</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
                    Confirmed
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Ref #mt-7981
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-t bg-card py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Built for reliable scheduling
              </h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Everything you need to run a Calendly-style booking flow.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} size="sm">
                    <CardHeader>
                      <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <p>&copy; 2026 Meetly. All rights reserved.</p>
          <p>
            Demo user: <span className="font-medium text-foreground">Niraj Kumar</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
