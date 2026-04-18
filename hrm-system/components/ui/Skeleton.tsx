import { cn } from "./cn";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "pill";
}

export function Skeleton({ className, width, height, rounded = "sm" }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", `rounded-${rounded}`, className)}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={10}
          width={i === lines - 1 && lines > 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-surface-raised border border-line-subtle rounded-md overflow-hidden divide-x divide-line-subtle">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-5 py-4 space-y-2.5">
          <Skeleton height={8} width={80} />
          <Skeleton height={28} width={110} />
          <Skeleton height={8} width={140} />
        </div>
      ))}
    </div>
  );
}
