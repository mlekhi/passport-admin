"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black"
          aria-hidden="true"
        >
          <span className="text-xs font-bold">▲</span>
        </div>
        <span className="min-w-0 text-base font-semibold leading-tight">Passport Intranet</span>
      </Link>
      <nav aria-label="Primary" className="flex shrink-0 items-center gap-4 text-sm">
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="text-black/50 transition-colors hover:text-black focus-visible:outline-none dark:text-white/50 dark:hover:text-white"
        >
          Dashboard
        </Link>
        <Link
          href="/deploy"
          aria-current={pathname === "/deploy" ? "page" : undefined}
          className="text-black/50 transition-colors hover:text-black focus-visible:outline-none dark:text-white/50 dark:hover:text-white"
        >
          Deploy
        </Link>
      </nav>
    </>
  );
}
