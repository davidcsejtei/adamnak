"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const [input, setInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const seedIfEmpty = useMutation(api.customers.seedIfEmpty);

  useEffect(() => {
    void seedIfEmpty();
  }, [seedIfEmpty]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(input), 300);
    return () => clearTimeout(handle);
  }, [input]);

  const results = useQuery(api.customers.search, { q: debouncedQuery });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Ügyfélkereső</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Keresés név vagy cím alapján — a találatok 300 ms késleltetéssel
          jelennek meg.
        </p>
      </header>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Keresés ügyfélre…"
        className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-black/20 dark:focus:border-white/40"
      />

      <ul className="flex flex-col gap-2">
        {results === undefined && (
          <li className="text-sm text-black/50 dark:text-white/50">
            Betöltés…
          </li>
        )}
        {results?.length === 0 && (
          <li className="text-sm text-black/50 dark:text-white/50">
            Nincs találat.
          </li>
        )}
        {results?.map((customer) => (
          <li
            key={customer._id}
            className="flex flex-col gap-0.5 rounded-md border border-black/10 bg-white px-3 py-2 dark:border-white/15 dark:bg-black/20"
          >
            <span className="text-sm font-medium">{customer.name}</span>
            <span className="text-xs text-black/60 dark:text-white/60">
              {customer.address}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
