"use client";

import { use, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, Mail, User, } from "lucide-react";
import { MeetlyLogo } from "@/components/meetly-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageLoading } from "@/components/page-loading";

function ConfirmationContent({ slug }) {
  const searchParams = useSearchParams();

  const inviteeName = searchParams.get("inviteeName") || "Invitee";
  const inviteeEmail = searchParams.get("inviteeEmail") || "";
  const startTime = searchParams.get("startTime");
  const hostName = searchParams.get("hostName") || "Host";
  const eventName = searchParams.get("eventName") || "Meeting";
  const duration = searchParams.get("duration") || "30";

  const formattedDate = useMemo(() => {
    if (!startTime) return "";
    return new Date(startTime).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }, [startTime]);

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto mb-6 flex max-w-lg justify-center">
        <MeetlyLogo />
      </div>

      <Card className="mx-auto max-w-lg shadow-lg">
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="size-14 text-emerald-600" />
          <CardTitle className="text-2xl">You&apos;re scheduled</CardTitle>
          <CardDescription>
            A calendar invitation was sent to{" "}
            <span className="font-medium text-foreground">{inviteeEmail}</span>.
            Your meeting with {hostName} is confirmed.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                What
              </p>
              <p className="mt-1 font-semibold">{eventName}</p>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Calendar className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  When
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formattedDate || "Loading..."}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {duration} minutes
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <User className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Who
                </p>
                <p className="mt-1 text-sm font-medium">{inviteeName}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="size-3" />
                  {inviteeEmail}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:flex-1">
            <Link href={`/book/${slug}`}>Schedule another</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:flex-1">
            <Link href="/">Done</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function BookingConfirmationPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const slug = params.slug;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <PageLoading />
        </div>
      }
    >
      <ConfirmationContent slug={slug} />
    </Suspense>
  );
}
