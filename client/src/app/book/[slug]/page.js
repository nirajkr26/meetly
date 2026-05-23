"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Globe, Loader2, AlertCircle, } from "lucide-react";
import { api } from "@/services/api";
import { PageLoading } from "@/components/page-loading";
import { BookingCalendar } from "@/components/booking-calendar";
import { MeetlyLogo } from "@/components/meetly-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { COMMON_TIMEZONES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function PublicBookingPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const slug = params.slug;

  const [eventType, setEventType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const [step, setStep] = useState("schedule");
  const [inviteeName, setInviteeName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [inviteeAnswers, setInviteeAnswers] = useState({});
  const [bookingError, setBookingError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const fetchEventTypeDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getPublicEventType(slug);
      setEventType(data);
      if (data.user?.timezone) {
        setTimezone(data.user.timezone);
      }
      setError(null);
    } catch (err) {
      setError(err.message || "This booking link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    fetchEventTypeDetails();
  }, [slug]);

  const fetchAvailableSlots = async (dateObj, tz = timezone) => {
    if (!dateObj) return;
    setLoadingSlots(true);
    setSelectedSlot(null);

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    try {
      const data = await api.getAvailableSlots(slug, dateStr, tz);
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleTimezoneChange = (tz) => {
    setTimezone(tz);
    if (selectedDate) {
      fetchAvailableSlots(selectedDate, tz);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleDateSelect = (day) => {
    const clicked = new Date(currentYear, currentMonth, day);
    setSelectedDate(clicked);
    fetchAvailableSlots(clicked);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setBookingLoading(true);
    setBookingError(null);

    try {
      const questions = Array.isArray(eventType.customQuestions)
        ? eventType.customQuestions
        : [];

      await api.createBooking(slug, {
        inviteeName,
        inviteeEmail,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        inviteeAnswers:
          questions.length > 0 ? inviteeAnswers : undefined,
      });

      const queryParams = new URLSearchParams({
        inviteeName,
        inviteeEmail,
        startTime: selectedSlot.startTime,
        hostName: eventType.user.name,
        eventName: eventType.name,
        duration: String(eventType.duration),
      }).toString();

      router.push(`/book/${slug}/confirmation?${queryParams}`);
    } catch (err) {
      setBookingError(err.message || "Failed to schedule event");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <PageLoading label="Loading booking page..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="mx-auto size-10 text-destructive" />
            <CardTitle>Invalid booking link</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto mb-6 flex max-w-5xl justify-center sm:justify-start">
        <MeetlyLogo />
      </div>

      {/* Booking card */}
      <Card className="mx-auto max-w-5xl overflow-hidden shadow-lg">
        <div className="flex flex-col lg:flex-row">
          {/* Left: event info */}
          <div className="border-b bg-muted/20 p-6 lg:w-[280px] lg:shrink-0 lg:border-b-0 lg:border-r xl:w-[300px]">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {eventType.user.name}
            </p>
            <h1 className="mt-1 text-xl font-bold leading-snug sm:text-2xl">
              {eventType.name}
            </h1>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4 shrink-0 text-primary" />
                <span>
                  {eventType.duration} min
                  {eventType.bufferMinutes > 0 &&
                    ` · ${eventType.bufferMinutes} min buffer`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="size-4 shrink-0 text-primary" />
                <span>Timezone aware</span>
              </div>
            </div>

            {eventType.description && (
              <>
                <Separator className="my-6" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {eventType.description}
                </p>
              </>
            )}
          </div>

          {/* Right: scheduling */}
          <div className="min-w-0 flex-1 p-4 sm:p-6">
            {step === "schedule" ? (
              <div className="flex flex-col gap-8 xl:flex-row xl:gap-10">
                {/* Calendar */}
                <div className="flex-1">
                  <h2 className="mb-4 text-lg font-semibold">
                    Select a date & time
                  </h2>

                  <div className="mb-4 space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Timezone
                    </Label>
                    <Select value={timezone} onValueChange={handleTimezoneChange}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <BookingCalendar
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onSelectDate={handleDateSelect}
                  />
                </div>

                {/* Time slots */}
                <div className="w-full border-t pt-6 xl:w-52 xl:shrink-0 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8">
                  <p className="mb-4 text-sm font-semibold">
                    {selectedDate
                      ? selectedDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                      : "Pick a date"}
                  </p>

                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground">
                      Select a date to see available times.
                    </p>
                  ) : loadingSlots ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-primary" />
                    </div>
                  ) : slots.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No times available for this date.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ScrollArea className="h-[min(320px,50vh)] pr-3">
                      <div className="flex flex-col gap-2">
                        {slots.map((slot, index) => {
                          const isSelected =
                            selectedSlot?.startTime === slot.startTime;

                          return (
                            <div key={index} className="flex flex-col gap-1.5">
                              <Button
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                  "w-full font-semibold",
                                  !isSelected && "border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                                )}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                {slot.localTime}
                              </Button>
                              {isSelected && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => setStep("details")}
                                >
                                  Continue
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            ) : (
              /* Details form */
              <div className="mx-auto max-w-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mb-4 -ml-2"
                  onClick={() => setStep("schedule")}
                >
                  <ArrowLeft className="size-3.5" />
                  Back
                </Button>

                <h2 className="text-lg font-semibold">Enter your details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedSlot?.localTime} on{" "}
                  {selectedDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>

                {bookingError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{bookingError}</AlertDescription>
                  </Alert>
                )}

                <form
                  onSubmit={handleBookingSubmit}
                  className="mt-6 space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      required
                      placeholder="Your name"
                      value={inviteeName}
                      onChange={(e) => setInviteeName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={inviteeEmail}
                      onChange={(e) => setInviteeEmail(e.target.value)}
                    />
                  </div>

                  {Array.isArray(eventType.customQuestions) &&
                    eventType.customQuestions.map((q) => (
                      <div key={q.id} className="space-y-2">
                        <Label htmlFor={`q-${q.id}`}>
                          {q.label}
                          {q.required && (
                            <span className="text-destructive"> *</span>
                          )}
                        </Label>
                        <Input
                          id={`q-${q.id}`}
                          required={q.required}
                          placeholder="Your answer"
                          value={inviteeAnswers[q.id] ?? ""}
                          onChange={(e) =>
                            setInviteeAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}

                  <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:flex-1"
                      onClick={() => setStep("schedule")}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={bookingLoading}
                      className="sm:flex-1"
                    >
                      {bookingLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        "Schedule event"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
