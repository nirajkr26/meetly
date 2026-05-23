"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { COMMON_TIMEZONES, DAYS_OF_WEEK } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function AvailabilityPage() {
  const [timezone, setTimezone] = useState("UTC");
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const data = await api.getAvailability();
      setTimezone(data.timezone);

      const scheduleMap = {};
      data.schedule.forEach((item) => {
        scheduleMap[item.dayOfWeek] = {
          enabled: true,
          startTime: item.startTime,
          endTime: item.endTime,
        };
      });
      setSchedule(scheduleMap);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleDayToggle = (dayVal, enabled) => {
    setSchedule((prev) => {
      if (!enabled) {
        const updated = { ...prev };
        delete updated[dayVal];
        return updated;
      }
      return {
        ...prev,
        [dayVal]: prev[dayVal] || {
          enabled: true,
          startTime: "09:00",
          endTime: "17:00",
        },
      };
    });
  };

  const handleTimeChange = (dayVal, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayVal]: { ...prev[dayVal], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const schedulePayload = Object.keys(schedule).map((dayKey) => ({
      dayOfWeek: Number(dayKey),
      startTime: schedule[dayKey].startTime,
      endTime: schedule[dayKey].endTime,
    }));

    try {
      await api.updateAvailability({ timezone, schedule: schedulePayload });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchAvailability();
    } catch (err) {
      setError(err.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoading label="Loading availability..." />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Weekly hours</CardTitle>
            <CardDescription>
              Set your timezone and when you&apos;re available to meet.
            </CardDescription>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full shrink-0 sm:w-auto"
          >
            {saving ? "Saving..." : success ? "Saved" : "Save changes"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>
                Availability updated. New bookings will use these hours.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full sm:max-w-xs">
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

          <div className="space-y-3">
            <Label>Active days</Label>
            {DAYS_OF_WEEK.map((day) => {
              const isEnabled = !!schedule[day.value]?.enabled;
              const daySettings = schedule[day.value] || {
                startTime: "09:00",
                endTime: "17:00",
              };

              return (
                <div
                  key={day.value}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
                    isEnabled ? "bg-card" : "bg-muted/40 opacity-80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      id={`day-${day.value}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        handleDayToggle(day.value, checked)
                      }
                    />
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="cursor-pointer font-medium"
                    >
                      {day.label}
                    </Label>
                  </div>

                  {isEnabled ? (
                    <div className="flex flex-wrap items-center gap-2 pl-11 sm:pl-0">
                      <Input
                        type="time"
                        value={daySettings.startTime}
                        onChange={(e) =>
                          handleTimeChange(
                            day.value,
                            "startTime",
                            e.target.value
                          )
                        }
                        className="w-[7.5rem]"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={daySettings.endTime}
                        onChange={(e) =>
                          handleTimeChange(day.value, "endTime", e.target.value)
                        }
                        className="w-[7.5rem]"
                      />
                    </div>
                  ) : (
                    <span className="pl-11 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:pl-0">
                      Unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
