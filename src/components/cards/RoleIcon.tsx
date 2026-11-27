import { assertNever, type Role } from "@/lib/game";

export function RoleIcon({
  role,
  className = "h-16 w-16",
}: {
  role: Role;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 64 64",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (role) {
    case "werewolf":
      return (
        <svg {...common}>
          <path d="M10 38c4-16 12-24 22-24s18 8 22 24" />
          <path d="M18 28 12 16m34 12 6-12" />
          <circle cx="24" cy="36" r="2" fill="currentColor" />
          <circle cx="40" cy="36" r="2" fill="currentColor" />
          <path d="M24 46c4 4 12 4 16 0" />
        </svg>
      );
    case "minion":
      return (
        <svg {...common}>
          <circle cx="32" cy="22" r="8" />
          <path d="M16 52c2-12 10-18 16-18s14 6 16 18" />
          <path d="M40 24c8 2 12 10 12 18" />
        </svg>
      );
    case "mason":
      return (
        <svg {...common}>
          <path d="M12 48h40L32 12 12 48Z" />
          <path d="M32 24v16M24 40h16" />
        </svg>
      );
    case "seer":
      return (
        <svg {...common}>
          <path d="M8 32c8-14 16-20 24-20s16 6 24 20c-8 14-16 20-24 20S16 46 8 32Z" />
          <circle cx="32" cy="32" r="8" />
        </svg>
      );
    case "robber":
      return (
        <svg {...common}>
          <path d="M16 28h32v20H16Z" />
          <path d="M22 28V22a10 10 0 0 1 20 0v6" />
          <path d="M32 36v6" />
        </svg>
      );
    case "troublemaker":
      return (
        <svg {...common}>
          <path d="M16 20c12 0 8 24 24 24S52 20 40 20 36 44 20 44 4 20 16 20Z" />
        </svg>
      );
    case "drunk":
      return (
        <svg {...common}>
          <path d="M24 12h16l-4 16c0 10-2 24-8 24s-8-14-8-24L24 12Z" />
          <path d="M22 12h20" />
        </svg>
      );
    case "insomniac":
      return (
        <svg {...common}>
          <path d="M40 16a18 18 0 1 0 8 32 16 16 0 0 1-8-32Z" />
        </svg>
      );
    case "villager":
      return (
        <svg {...common}>
          <path d="M12 52V28L32 12l20 16v24H12Z" />
          <path d="M26 52V36h12v16" />
        </svg>
      );
    case "hunter":
      return (
        <svg {...common}>
          <path d="M14 32h36" />
          <path d="M14 32c10-16 26-16 36 0-10 16-26 16-36 0Z" />
          <path d="M40 22 54 12" />
        </svg>
      );
    case "tanner":
      return (
        <svg {...common}>
          <path d="M16 18h32v28H16Z" />
          <path d="M16 18c8 8 24 8 32 0" />
          <path d="M24 32h16" />
        </svg>
      );
    case "doppelganger":
      return (
        <svg {...common}>
          <circle cx="24" cy="32" r="12" />
          <circle cx="40" cy="32" r="12" />
        </svg>
      );
    default:
      return assertNever(role);
  }
}
