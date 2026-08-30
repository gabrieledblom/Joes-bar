import type { Metadata } from "next";
import { KoksInloggning } from "@/components/kok/KoksInloggning";

export const metadata: Metadata = {
  title: "Logga in",
  robots: { index: false, follow: false },
};

export default function Inloggningssida() {
  return <KoksInloggning />;
}
