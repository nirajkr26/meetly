import Link from "next/link";
import { cn } from "@/lib/utils";

export function MeetlyLogo({ className, showText = true, href = "/" }) {
  const content = (
    <>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        M
      </div>
      {showText && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Meetly
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("flex items-center gap-2.5", className)}>
        {content}
      </Link>
    );
  }

  return <div className={cn("flex items-center gap-2.5", className)}>{content}</div>;
}
