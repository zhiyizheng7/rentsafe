"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/data/mock-data";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[color:var(--text-secondary)]">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`transition hover:text-[color:var(--text-primary)] ${
              isActive ? "font-semibold text-[color:var(--primary)]" : ""
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
