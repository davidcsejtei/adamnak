"use client";

import { useState, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const tasks = useQuery(api.tasks.list);
  const addTask = useMutation(api.tasks.add);
  const toggleTask = useMutation(api.tasks.toggle);
  const removeTask = useMutation(api.tasks.remove);
  const [text, setText] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    await addTask({ text: trimmed });
    setText("");
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Next.js + Convex
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Valós idejű feladatlista Convex háttérrel, Vercelen telepítve.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Új feladat…"
          className="flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-black/20 dark:focus:border-white/40"
        />
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          Hozzáad
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {tasks === undefined && (
          <li className="text-sm text-black/50 dark:text-white/50">Betöltés…</li>
        )}
        {tasks?.length === 0 && (
          <li className="text-sm text-black/50 dark:text-white/50">
            Még nincs feladat. Adj hozzá egyet!
          </li>
        )}
        {tasks?.map((task) => (
          <li
            key={task._id}
            className="flex items-center gap-3 rounded-md border border-black/10 bg-white px-3 py-2 dark:border-white/15 dark:bg-black/20"
          >
            <input
              type="checkbox"
              checked={task.isCompleted}
              onChange={() => toggleTask({ id: task._id })}
              className="h-4 w-4"
            />
            <span
              className={`flex-1 text-sm ${
                task.isCompleted
                  ? "text-black/40 line-through dark:text-white/40"
                  : ""
              }`}
            >
              {task.text}
            </span>
            <button
              onClick={() => removeTask({ id: task._id })}
              className="text-xs text-black/50 hover:text-red-600 dark:text-white/50 dark:hover:text-red-400"
              aria-label="Törlés"
            >
              törlés
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
