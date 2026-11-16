import type { SocialPlatformId } from '../data/social';

interface IconProps {
  className?: string;
}

export function LinkedInIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
    </svg>
  );
}

export function InstagramIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function YouTubeIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M21.58 7.19a2.75 2.75 0 0 0-1.94-1.94C17.93 4.78 12 4.78 12 4.78s-5.93 0-7.64.47a2.75 2.75 0 0 0-1.94 1.94C1.96 8.9 1.96 12 1.96 12s0 3.1.46 4.81a2.75 2.75 0 0 0 1.94 1.94c1.71.47 7.64.47 7.64.47s5.93 0 7.64-.47a2.75 2.75 0 0 0 1.94-1.94c.46-1.71.46-4.81.46-4.81s0-3.1-.46-4.81ZM10 15.1V8.9l5.2 3.1-5.2 3.1Z" />
    </svg>
  );
}

export function SocialBrandIcon({
  id,
  className = 'h-4 w-4',
}: {
  id: SocialPlatformId;
  className?: string;
}) {
  if (id === 'linkedin') return <LinkedInIcon className={className} />;
  if (id === 'instagram') return <InstagramIcon className={className} />;
  return <YouTubeIcon className={className} />;
}
