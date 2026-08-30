import type { Metadata, Viewport } from "next";
import { Koksskarm } from "@/components/kok/Koksskarm";

export const metadata: Metadata = {
  title: "Kök",
  robots: { index: false, follow: false },
};

// Skärmen sitter ofta på en surfplatta i liggande läge. Ingen ska kunna
// zooma bort en kolumn av misstag med feta fingrar.
export const viewport: Viewport = {
  themeColor: "#0b0614",
  maximumScale: 1,
};

export default function Kokssida() {
  return <Koksskarm />;
}
