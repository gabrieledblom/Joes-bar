"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/**
 * Töm varukorgen när gästen landar på en betald order. Det sker här och
 * inte i kassan, eftersom en avbruten betalning ska lämna beställningen
 * orörd så att gästen kan försöka igen.
 */
export function TomVarukorg() {
  const { toem, antalVaror, laddad } = useCart();

  useEffect(() => {
    if (laddad && antalVaror > 0) toem();
  }, [laddad, antalVaror, toem]);

  return null;
}
