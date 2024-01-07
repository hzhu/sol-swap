import clsx from "clsx";
import { useState, forwardRef } from "react";
import { Button } from "react-aria-components";
import type { AriaButtonProps } from "react-aria";

export const DirectionButton = forwardRef<
  HTMLButtonElement,
  AriaButtonProps & { className?: string }
>(({ onPress, className, ...props }, ref) => {
  const [rotated, setRotated] = useState(false);
  const arrowStyles = clsx(
    "transition-all duration-200",
    rotated ? "rotate-180" : ""
  );

  return (
    <Button
      ref={ref}
      className={clsx(
        "w-10 h-7 text-md rounded flex items-center justify-center translate-y-1.5 select-none text-white",
        "rounded-full transition-all duration-200 disabled:cursor-not-allowed",
        className
      )}
      onPress={(e) => {
        if (onPress) onPress(e);
        setRotated(!rotated);
      }}
      {...props}
    >
      <span className={arrowStyles}>&#8595;</span>
      <span className={arrowStyles}>&#8593;</span>
    </Button>
  );
});

DirectionButton.displayName = "DirectionButton";
