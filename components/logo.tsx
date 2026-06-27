export function LogoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="32" height="32" rx="6" fill="#008751" />
      <path
        d="M8 14h16v12a1 1 0 01-1 1H9a1 1 0 01-1-1V14z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M6 12l10-7 10 7v1H6v-1z"
        fill="white"
      />
      <path
        d="M14 18h4v9h-4z"
        fill="#008751"
      />
      <path
        d="M18 8h-4l-1-2h6l-1 2z"
        fill="#e9f6f0"
      />
    </svg>
  );
}
