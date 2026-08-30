"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logotyp } from "@/components/Logotyp";

export function KoksInloggning() {
  const router = useRouter();
  const [losenord, setLosenord] = useState("");
  const [fel, setFel] = useState("");
  const [skickar, setSkickar] = useState(false);

  async function skicka(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSkickar(true);
    setFel("");

    const data = new FormData();
    data.set("losenord", losenord);

    try {
      const svar = await fetch("/api/kok/logga-in", {
        method: "POST",
        body: data,
      });
      if (svar.ok) {
        router.push("/kok");
        router.refresh();
        return;
      }
      const kropp = await svar.json();
      setFel(kropp.fel ?? "Kunde inte logga in.");
    } catch {
      setFel("Ingen kontakt med servern.");
    }
    setSkickar(false);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={skicka} className="w-full max-w-sm">
        <Logotyp className="text-2xl" />
        <h1 className="jb-display mt-5 text-3xl text-jb-text">Köksskärmen</h1>

        <label
          htmlFor="losenord"
          className="mt-8 block text-sm font-medium text-jb-text"
        >
          Lösenord
        </label>
        <input
          id="losenord"
          name="losenord"
          type="password"
          autoComplete="current-password"
          value={losenord}
          onChange={(e) => setLosenord(e.target.value)}
          required
          autoFocus
          className="mt-2 w-full rounded-jb border border-jb-linje bg-jb-yta px-4 py-3.5 text-base text-jb-text focus:border-jb-rosa focus:outline-none"
        />

        {fel ? (
          <p role="alert" className="mt-4 text-sm text-jb-orange">
            {fel}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={skickar}
          className="mt-6 w-full rounded-jb bg-jb-rosa px-6 py-4 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork disabled:opacity-60"
        >
          {skickar ? "Loggar in..." : "Logga in"}
        </button>
      </form>
    </main>
  );
}
