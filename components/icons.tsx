type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const IconCheck = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconSearch = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const IconUpload = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M12 16V4m0 0-4 4m4-4 4 4" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
);
export const IconTrash = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" /></svg>
);
export const IconPencil = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M4 20h4L19 9l-4-4L4 16v4Z" /></svg>
);
export const IconPlus = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconX = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconLogout = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
);
export const IconBolt = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
);
export const IconUsers = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></svg>
);
export const IconBallot = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><rect x="3" y="12" width="18" height="9" rx="1" /><path d="M7 12V9l5-5 5 5v3M9.5 16h5" /></svg>
);
export const IconChart = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M4 20V10m6 10V4m6 16v-7m4 7H3" /></svg>
);
