import clsx from "clsx";
import type { HTMLAttributes } from "react";

type SpinnerProps = HTMLAttributes<SVGElement> & {
  size?: number;
};

const defaultClass = `animate-spin -ml-1 text-blue-marguerite-600 dark:text-blue-marguerite-50`;

export const Spinner = ({
  size = 7,
  style,
  className,
  ...props
}: SpinnerProps) => {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(defaultClass, className)}
      style={{ width: `${size}rem`, height: `${size}rem`, ...style }}
      {...props}
    >
      <circle
        cx={12}
        cy={12}
        r={10}
        strokeWidth={4}
        stroke="currentColor"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        className="opacity-75"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
