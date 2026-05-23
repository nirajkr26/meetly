"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Copy, Check, Pencil, Trash2, ExternalLink, Clock, X, } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/services/api";
import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { DURATION_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const cardActionClass = "cursor-pointer transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-muted/80";

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState("30");
  const [description, setDescription] = useState("");
  const [bufferMinutes, setBufferMinutes] = useState("0");
  const [customQuestions, setCustomQuestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(null);

  const newQuestionId = () =>
    `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const data = await api.getEventTypes();
      setEventTypes(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load event types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!editingEvent) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(generatedSlug);
    }
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setName(event.name);
      setSlug(event.slug);
      setDuration(String(event.duration));
      setDescription(event.description || "");
      setBufferMinutes(String(event.bufferMinutes ?? 0));
      setCustomQuestions(
        Array.isArray(event.customQuestions) ? event.customQuestions : []
      );
    } else {
      setEditingEvent(null);
      setName("");
      setSlug("");
      setDuration("30");
      setDescription("");
      setBufferMinutes("0");
      setCustomQuestions([]);
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      slug: slug.trim(),
      duration: Number(duration),
      description: description.trim() || undefined,
      bufferMinutes: Number(bufferMinutes) || 0,
      customQuestions: customQuestions
        .filter((q) => q.label.trim())
        .map((q) => ({
          id: q.id,
          label: q.label.trim(),
          required: q.required !== false,
        })),
    };

    try {
      if (editingEvent) {
        await api.updateEventType(editingEvent.id, payload);
      } else {
        await api.createEventType(payload);
      }
      await fetchEventTypes();
      setIsOpen(false);
      setEditingEvent(null);
    } catch (err) {
      setError(err.message || "Failed to save event type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event type? Public booking links for it will stop working.")) {
      return;
    }
    try {
      await api.deleteEventType(id);
      await fetchEventTypes();
    } catch (err) {
      alert(err.message || "Failed to delete event type");
    }
  };

  const handleCopyLink = (eventSlug) => {
    const url = `${window.location.origin}/book/${eventSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(eventSlug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  if (loading) {
    return <PageLoading label="Loading event types..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Create booking links invitees can use to schedule with you.
        </p>
        <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
          <Plus className="size-4" />
          New event type
        </Button>
      </div>

      {error && eventTypes.length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {eventTypes.map((event) => (
          <Card key={event.id} className="flex flex-col">
            <div className="h-1 bg-primary" />
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="size-3" />
                    {event.duration} min
                  </Badge>
                  {event.bufferMinutes > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{event.bufferMinutes}m buffer
                    </Badge>
                  )}
                </div>
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  /{event.slug}
                </span>
              </div>
              <CardTitle className="line-clamp-1">{event.name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-10">
                {event.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto flex flex-wrap gap-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyLink(event.slug)}
                className={cn(
                  cardActionClass,
                  copiedSlug === event.slug &&
                  "text-emerald-600 hover:bg-emerald-500/25 hover:text-emerald-700 dark:hover:bg-emerald-500/30"
                )}
              >
                {copiedSlug === event.slug ? (
                  <>
                    <Check className="size-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy link
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cardActionClass}
              >
                <Link href={`/book/${event.slug}`} target="_blank">
                  <ExternalLink className="size-3.5" />
                  Preview
                </Link>
              </Button>
              <div className="ml-auto flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleOpenModal(event)}
                  aria-label="Edit"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(event.id)}
                  className="text-destructive hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className={cn(
            "flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-card p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <Plus className="size-8 text-muted-foreground" />
          <span className="font-medium">Add event type</span>
          <span className="text-xs text-muted-foreground">
            Create a new scheduling link
          </span>
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit event type" : "Create event type"}
            </DialogTitle>
            <DialogDescription>
              Set the name, URL slug, and duration for this booking page.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event name</Label>
              <Input
                id="event-name"
                required
                placeholder="15 Minute Coffee Chat"
                value={name}
                onChange={handleNameChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-slug">URL slug</Label>
              <div className="flex overflow-hidden rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">
                  /book/
                </span>
                <Input
                  id="event-slug"
                  required
                  className="rounded-none border-0 shadow-none focus-visible:ring-0"
                  placeholder="15-min-coffee"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea
                id="event-desc"
                placeholder="What should invitees know before booking?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-buffer">Buffer time (minutes)</Label>
              <Input
                id="event-buffer"
                type="number"
                min={0}
                max={120}
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Extra gap before and after each meeting when showing slots.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Custom invitee questions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCustomQuestions((prev) => [
                      ...prev,
                      { id: newQuestionId(), label: "", required: true },
                    ])
                  }
                >
                  <Plus className="size-3.5" />
                  Add question
                </Button>
              </div>
              {customQuestions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Optional — e.g. &quot;What would you like to discuss?&quot;
                </p>
              ) : (
                <div className="space-y-2">
                  {customQuestions.map((q, index) => (
                    <div
                      key={q.id}
                      className="flex flex-col gap-2 rounded-lg border p-3"
                    >
                      <div className="flex gap-2">
                        <Input
                          placeholder="Question label"
                          value={q.label}
                          onChange={(e) => {
                            const next = [...customQuestions];
                            next[index] = { ...q, label: e.target.value };
                            setCustomQuestions(next);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            setCustomQuestions((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                          aria-label="Remove question"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`req-${q.id}`}
                          checked={q.required !== false}
                          onCheckedChange={(checked) => {
                            const next = [...customQuestions];
                            next[index] = {
                              ...q,
                              required: checked === true,
                            };
                            setCustomQuestions(next);
                          }}
                        />
                        <Label
                          htmlFor={`req-${q.id}`}
                          className="text-xs font-normal"
                        >
                          Required
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingEvent
                    ? "Save changes"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
