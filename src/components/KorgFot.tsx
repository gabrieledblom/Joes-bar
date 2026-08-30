"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { useCart } from "@/lib/cart";
import { formateraPris } from "@/lib/pengar";

/**
 * Klistrad summa längst ned på menysidan. Den enda vägen till kassan från
 * menyn, så den ska aldrig konkurrera med något annat om uppmärksamheten.
 */
export function KorgFot() {
  const { antalVaror, summa, laddad } = useCart();
  const dampad = useReducedMotion();
  const synlig = laddad && antalVaror > 0;

  return (
    <AnimatePresence>
      {synlig ? (
        <motion.div
          initial={dampad ? false : { y: 80 }}
          animate={{ y: 0 }}
          exit={dampad ? undefined : { y: 80 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-jb-linje bg-jb-botten-2/95 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="min-w-0">
              <p className="text-xs text-jb-dampad">
                {antalVaror} {antalVaror === 1 ? "vara" : "varor"}
              </p>
              <p className="jb-display text-xl tabular-nums text-jb-text">
                {formateraPris(summa)}
              </p>
            </div>
            <Link
              href="/kassa"
              className="ml-auto inline-flex items-center gap-2 rounded-jb bg-jb-rosa px-6 py-3.5 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork active:scale-[0.98]"
            >
              Till kassan
              <ArrowRightIcon size={18} weight="bold" aria-hidden />
            </Link>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
