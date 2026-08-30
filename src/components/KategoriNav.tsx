"use client";

import { kategorier } from "@/data/menu-data";

/**
 * Vågrätt kategorirad under headern. På mobil är menyn lång; utan den här
 * får gästen skrolla förbi tio pizzor för att hitta sides.
 */
export function KategoriNav() {
  return (
    <nav
      aria-label="Kategorier"
      className="sticky top-16 z-30 border-b border-jb-linje bg-jb-botten/90 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {kategorier.map((kategori) => (
          <li key={kategori.id}>
            <a
              href={`#${kategori.id}`}
              className="block whitespace-nowrap rounded-jb px-3 py-2 text-sm text-jb-dampad transition-colors hover:bg-jb-yta hover:text-jb-text"
            >
              {kategori.namn}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
