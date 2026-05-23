import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageLoading({ className, label = "Loading..." }) {
  return (
    <div className={cn("flex min-h-[50vh] flex-col items-center justify-center gap-3", className)}>
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
