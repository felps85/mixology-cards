"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Drinks
        </Link>
        <div className="text-sm text-white/60">Cocktail gallery</div>
      </div>
    </header>
  );
}
