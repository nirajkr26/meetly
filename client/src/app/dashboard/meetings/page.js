"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Mail, User, XCircle, CalendarSync, Loader2, } from "lucide-react";
import { api } from "@/services/api";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function formatMeetingDate(dateIso) {
  return new Date(dateIso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateForInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function MeetingCard({ meeting, onCancel, onReschedule, showActions }) {
  const isCancelled = meeting.status === "CANCELLED";

  return (
    <Card
      size="sm"
      className={isCancelled ? "border-destructive/20 bg-destructive/5" : ""}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isCancelled ? "destructive" : "secondary"}>
            {isCancelled ? "Cancelled" : meeting.eventType.name}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {meeting.eventType.duration} min
          </span>
        </div>
        <CardTitle
          className={`text-base ${isCancelled ? "text-muted-foreground line-through" : ""}`}
        >
          {formatMeetingDate(meeting.startTime)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
          <span className="flex items-center gap-1.5">
            <User className="size-3.5 shrink-0" />
            {meeting.inviteeName}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="size-3.5 shrink-0" />
            {meeting.inviteeEmail}
          </span>
        </div>

        {isCancelled && meeting.cancellationReason && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            <strong>Reason:</strong> {meeting.cancellationReason}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="font-mono text-[10px] text-muted-foreground">
            #{meeting.id}
          </span>
          {showActions && !isCancelled && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReschedule(meeting)}
              >
                <CalendarSync className="size-3.5" />
                Reschedule
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(meeting)}
              >
                <XCircle className="size-3.5" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, description }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <CalendarClock className="size-10 text-muted-foreground/50" />
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="max-w-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export default function MeetingsPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingMeeting, setCancellingMeeting] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [reschedulingMeeting, setReschedulingMeeting] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await api.getMeetings();
      setUpcoming(data.upcoming || []);
      setPast(data.past || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    fetchMeetings();
  }, []);

  const handleCancelMeeting = async (e) => {
    e.preventDefault();
    if (!cancellingMeeting) return;

    setCancelling(true);
    try {
      await api.cancelMeeting(cancellingMeeting.id, cancellationReason);
      await fetchMeetings();
      setCancellingMeeting(null);
      setCancellationReason("");
    } catch (err) {
      alert(err.message || "Failed to cancel meeting");
    } finally {
      setCancelling(false);
    }
  };

  const openReschedule = (meeting) => {
    setReschedulingMeeting(meeting);
    setRescheduleDate(formatDateForInput(new Date(meeting.startTime)));
    setRescheduleSlots([]);
    setSelectedRescheduleSlot(null);
    setRescheduleError(null);
  };

  const loadRescheduleSlots = async (dateStr) => {
    if (!reschedulingMeeting || !dateStr) return;
    setLoadingRescheduleSlots(true);
    setSelectedRescheduleSlot(null);
    setRescheduleError(null);
    try {
      const data = await api.getAvailableSlots(
        reschedulingMeeting.eventType.slug,
        dateStr,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        reschedulingMeeting.id
      );
      setRescheduleSlots(data.slots || []);
    } catch (err) {
      setRescheduleSlots([]);
      setRescheduleError(err.message || "Failed to load slots");
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  useEffect(() => {
    if (reschedulingMeeting && rescheduleDate) {
      loadRescheduleSlots(rescheduleDate);
    }
  }, [rescheduleDate, reschedulingMeeting?.id]);

  const handleReschedule = async () => {
    if (!reschedulingMeeting || !selectedRescheduleSlot) return;
    setRescheduling(true);
    setRescheduleError(null);
    try {
      await api.rescheduleMeeting(reschedulingMeeting.id, {
        startTime: selectedRescheduleSlot.startTime,
        endTime: selectedRescheduleSlot.endTime,
      });
      await fetchMeetings();
      setReschedulingMeeting(null);
      setSelectedRescheduleSlot(null);
    } catch (err) {
      setRescheduleError(err.message || "Failed to reschedule");
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) {
    return <PageLoading label="Loading meetings..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming meetings"
              description="When someone books through your public link, meetings appear here."
            />
          ) : (
            upcoming.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                showActions
                onCancel={setCancellingMeeting}
                onReschedule={openReschedule}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-4">
          {past.length === 0 ? (
            <EmptyState
              title="No past meetings"
              description="Completed and cancelled meetings will show up here."
            />
          ) : (
            past.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!cancellingMeeting}
        onOpenChange={(open) => !open && setCancellingMeeting(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel meeting</DialogTitle>
            <DialogDescription>
              Cancel the{" "}
              <strong>{cancellingMeeting?.eventType.name}</strong> with{" "}
              <strong>{cancellingMeeting?.inviteeName}</strong> on{" "}
              {cancellingMeeting &&
                formatMeetingDate(cancellingMeeting.startTime)}
              .
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCancelMeeting} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">
                Reason <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Let the invitee know why you're cancelling..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancellingMeeting(null)}
              >
                Keep meeting
              </Button>
              <Button type="submit" variant="destructive" disabled={cancelling}>
                {cancelling ? "Cancelling..." : "Confirm cancel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!reschedulingMeeting}
        onOpenChange={(open) => !open && setReschedulingMeeting(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule meeting</DialogTitle>
            <DialogDescription>
              Pick a new time for <strong>{reschedulingMeeting?.inviteeName}</strong>
              . Confirmation emails will be sent to the invitee and host.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                min={formatDateForInput(new Date())}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>

            {rescheduleError && (
              <Alert variant="destructive">
                <AlertDescription>{rescheduleError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Available times</Label>
              {loadingRescheduleSlots ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : rescheduleSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No slots available for this date.
                </p>
              ) : (
                <ScrollArea className="h-48 pr-3">
                  <div className="flex flex-col gap-2">
                    {rescheduleSlots.map((slot, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant={
                          selectedRescheduleSlot?.startTime === slot.startTime
                            ? "default"
                            : "outline"
                        }
                        className={cn(
                          "w-full font-semibold",
                          selectedRescheduleSlot?.startTime !==
                            slot.startTime &&
                            "border-primary/30 text-primary hover:bg-primary/10"
                        )}
                        onClick={() => setSelectedRescheduleSlot(slot)}
                      >
                        {slot.localTime}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReschedulingMeeting(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedRescheduleSlot || rescheduling}
              onClick={handleReschedule}
            >
              {rescheduling ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Confirm reschedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
