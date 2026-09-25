import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db, harDatabas } from "./index";
import { orders, type NyOrder, type Order, type OrderStatus } from "./schema";

/* ---------------------------------------------------------------------------
 * Minnesläge: används bara när DATABASE_URL saknas, alltså under lokal
 * utveckling innan databasen är skapad. Innehållet försvinner när servern
 * startas om - det är hela poängen, ingen riktig order ska ligga här.
 * ------------------------------------------------------------------------ */
const minne = new Map<string, Order>();

function nu() {
  return new Date();
}

export async function skapaOrder(data: NyOrder): Promise<Order> {
  if (!harDatabas()) {
    const order = {
      id: crypto.randomUUID(),
      status: "vantar_betalning",
      kundTelefon: null,
      kundEpost: null,
      typ: "avhamtning",
      bordsnummer: null,
      notering: null,
      stripePaymentIntentId: null,
      betaldMed: null,
      kvittoEpostSkickat: null,
      kvittoSmsSkickat: null,
      betald: null,
      skapad: nu(),
      uppdaterad: nu(),
      ...data,
    } as Order;
    minne.set(order.id, order);
    return order;
  }
  const [order] = await db().insert(orders).values(data).returning();
  return order;
}

/** Postgres felkod för brott mot en unik-begränsning. */
const UNIK_KROCK = "23505";

function arUnikKrock(fel: unknown): boolean {
  const kod = (f: unknown) =>
    typeof f === "object" && f !== null && "code" in f
      ? (f as { code: unknown }).code
      : undefined;
  return (
    kod(fel) === UNIK_KROCK ||
    kod((fel as { cause?: unknown } | null)?.cause) === UNIK_KROCK
  );
}

/**
 * Ordernumren är korta för att kunna ropas upp, så de krockar ibland med ett
 * gammalt nummer. Då dras ett nytt i stället för att gästens köp misslyckas.
 */
export async function skapaOrderMedNummer(
  data: Omit<NyOrder, "ordernummer">,
  nyttNummer: () => string,
  maxForsok = 20,
): Promise<Order> {
  for (let forsok = 1; ; forsok++) {
    const ordernummer = nyttNummer();
    if (!harDatabas() && (await hamtaOrderViaNummer(ordernummer))) {
      if (forsok >= maxForsok) break;
      continue;
    }
    try {
      return await skapaOrder({ ...data, ordernummer });
    } catch (fel) {
      if (!arUnikKrock(fel) || forsok >= maxForsok) throw fel;
    }
  }
  throw new Error("Hittade inget ledigt ordernummer.");
}

export async function hamtaOrder(id: string): Promise<Order | undefined> {
  if (!harDatabas()) return minne.get(id);
  const [order] = await db().select().from(orders).where(eq(orders.id, id));
  return order;
}

export async function hamtaOrderViaNummer(
  ordernummer: string,
): Promise<Order | undefined> {
  if (!harDatabas()) {
    return [...minne.values()].find((o) => o.ordernummer === ordernummer);
  }
  const [order] = await db()
    .select()
    .from(orders)
    .where(eq(orders.ordernummer, ordernummer));
  return order;
}

export async function hamtaOrderViaPaymentIntent(
  paymentIntentId: string,
): Promise<Order | undefined> {
  if (!harDatabas()) {
    return [...minne.values()].find(
      (o) => o.stripePaymentIntentId === paymentIntentId,
    );
  }
  const [order] = await db()
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntentId));
  return order;
}

export async function uppdateraOrder(
  id: string,
  data: Partial<NyOrder>,
): Promise<Order | undefined> {
  if (!harDatabas()) {
    const befintlig = minne.get(id);
    if (!befintlig) return undefined;
    const uppdaterad = { ...befintlig, ...data, uppdaterad: nu() } as Order;
    minne.set(id, uppdaterad);
    return uppdaterad;
  }
  const [order] = await db()
    .update(orders)
    .set({ ...data, uppdaterad: nu() })
    .where(eq(orders.id, id))
    .returning();
  return order;
}

/**
 * Flyttar en order från "vantar_betalning" till "ny" i ett enda villkorat
 * anrop. Stripe kan leverera samma händelse två gånger samtidigt; bara ett
 * av anropen får tillbaka ordern, så kvittot skickas en gång.
 */
export async function markeraBetald(
  id: string,
  data: Pick<NyOrder, "betald" | "betaldMed">,
): Promise<Order | undefined> {
  if (!harDatabas()) {
    const befintlig = minne.get(id);
    if (!befintlig || befintlig.status !== "vantar_betalning") return undefined;
    return uppdateraOrder(id, { ...data, status: "ny" });
  }
  const [order] = await db()
    .update(orders)
    .set({ ...data, status: "ny", uppdaterad: nu() })
    .where(and(eq(orders.id, id), eq(orders.status, "vantar_betalning")))
    .returning();
  return order;
}

/**
 * Köksskärmens vy. Betalda ordrar, nyast först. Levererade och avbrutna
 * faller bort efter ett dygn så att skärmen inte växer i oändlighet under
 * ett pass.
 */
export async function hamtaKoksordrar(): Promise<Order[]> {
  const synliga: OrderStatus[] = ["ny", "tillagas", "klar", "levererad"];
  const grans = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (!harDatabas()) {
    return [...minne.values()]
      .filter((o) => synliga.includes(o.status) && o.skapad >= grans)
      .sort((a, b) => b.skapad.getTime() - a.skapad.getTime());
  }
  return db()
    .select()
    .from(orders)
    .where(and(inArray(orders.status, synliga), gte(orders.skapad, grans)))
    .orderBy(desc(orders.skapad));
}
