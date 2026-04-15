import type { SVGProps } from "react";

export function NairaSign(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      {/* Left vertical stroke of N */}
      <line x1="7" y1="20" x2="7" y2="4" />
      {/* Right vertical stroke of N */}
      <line x1="17" y1="4" x2="17" y2="20" />
      {/* Diagonal stroke of N */}
      <line x1="7" y1="4" x2="17" y2="20" />
      {/* Top horizontal bar */}
      <line x1="4" y1="9" x2="20" y2="9" />
      {/* Bottom horizontal bar */}
      <line x1="4" y1="15" x2="20" y2="15" />
    </svg>
  );
}
