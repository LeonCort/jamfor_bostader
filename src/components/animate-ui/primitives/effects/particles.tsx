"use client";

import * as React from "react";

// Minimal no-op particles primitives to satisfy imports.
// These intentionally avoid any animation logic and simply render children/elements.

type ParticlesProps = React.ComponentProps<"div"> & {
  asChild?: boolean;
  animate?: boolean;
};

function Particles({ asChild = false, children, ...props }: ParticlesProps) {
  if (asChild && React.isValidElement(children)) {
    // Pass through props to the child when used asChild
    return React.cloneElement(children as React.ReactElement, props);
  }
  return (
    <div data-slot="particles" {...props}>
      {children}
    </div>
  );
}

type ParticlesEffectProps = React.ComponentProps<"div"> & {
  "data-variant"?: string;
};

function ParticlesEffect({ children, ...props }: ParticlesEffectProps) {
  return (
    <div data-slot="particles-effect" aria-hidden {...props}>
      {children}
    </div>
  );
}

export { Particles, ParticlesEffect };

