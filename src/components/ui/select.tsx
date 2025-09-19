"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none transition disabled:cursor-not-allowed disabled:opacity-50",
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export { Select };

