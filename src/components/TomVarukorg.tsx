"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

const NYCKEL = "joesbar-tomd-for-order";

/**
 * Töm varukorgen när gästen landar på en betald order. Det sker här och
 * inte i kassan, eftersom en avbruten betalning ska lämna beställningen
 * orörd så att gästen kan försöka igen.
 *
 * Bara en gång per order: öppnar gästen en gammal ordersida senare (t.ex.
 * via webbläsarhistoriken) ska en ny varukorg inte försvinna.
 */
export function TomVarukorg({ orderId }: { orderId: string }) {
  const { toem, antalVaror, laddad } = useCart();

  useEffect(() => {
    if (!laddad || antalVaror === 0) return;
    try {
      if (window.localStorage.getItem(NYCKEL) === orderId) return;
      window.localStorage.setItem(NYCKEL, orderId);
    } catch {
      // Utan lagring: töm ändå, det är det vanliga fallet direkt efter köpet.
    }
    toem();
  }, [laddad, antalVaror, toem, orderId]);

  return null;
}
