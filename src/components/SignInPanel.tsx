"use client";

import type { ClientSafeProvider } from "next-auth/react";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export function SignInPanel() {
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider>>();
  const providerList = providers ? Object.values(providers) : [];

  useEffect(() => {
    getProviders().then((p) => setProviders(p ?? undefined));
  }, []);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-white/70">
        Sign in with one of the configured providers to access the drinks deck.
      </p>
      <div className="mt-6 space-y-2">
        {providerList.length
          ? providerList.map((p) => (
              <button
                key={p.id}
                className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-white/90"
                onClick={() => signIn(p.id, { callbackUrl: "/" })}
              >
                Continue with {p.name}
              </button>
            ))
          : (
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70">
              No sign-in providers are configured yet.
            </div>
          )}
      </div>
    </div>
  );
}
