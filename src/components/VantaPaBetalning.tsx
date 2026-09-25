"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { restaurang } from "@/data/restaurang";

const INTERVALL_MS = 3000;
/** Efter ungefär tre minuter slutar vi fråga och ber gästen ringa i stället. */
const MAX_FORSOK = 60;

/**
 * Stripes webhook kommer ofta några sekunder efter att gästen skickats hit
 * från Swish eller 3D Secure. Sidan laddas om i bakgrunden tills ordern är
 * bekräftad, så att gästen inte står och tittar på "väntar" i onödan.
 */
export function VantaPaBetalning() {
  const router = useRouter();
  const [forsok, setForsok] = useState(0);

  useEffect(() => {
    if (forsok >= MAX_FORSOK) return;
    const timer = setTimeout(() => {
      router.refresh();
      setForsok((n) => n + 1);
    }, INTERVALL_MS);
    return () => clearTimeout(timer);
  }, [forsok, router]);

  if (forsok < MAX_FORSOK) return null;

  return (
    <p role="status" className="mt-4 text-sm text-jb-orange">
      Vi har inte fått någon bekräftelse från betalningen än.
      {restaurang.telefon
        ? ` Ring oss på ${restaurang.telefon} så kollar vi din order.`
        : " Kontakta oss så kollar vi din order."}
    </p>
  );
}
