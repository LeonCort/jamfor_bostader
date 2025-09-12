"use client";

import * as React from "react";

type CompareCellProps = {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

export default function CompareCell({ onClick, className, children }: CompareCellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full text-left px-4 py-4 rounded-md hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
        (className ?? "")
      }
    >
      <div className="flex items-center gap-1 leading-none">{children}</div>
    </button>
  );
}

