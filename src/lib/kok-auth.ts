/**
 * Inloggning till köksskärmen. En delad lösenordsfras, en signerad kaka.
 * Ett internt verktyg på en enda adress med en handfull användare behöver
 * inga konton; det skulle bara ge personalen mer att glömma bort.
 *
 * Web Crypto i stället för node:crypto: middleware kör på Edge-runtimen,
 * där node:crypto inte finns.
 */
export const KOK_KAKA = "joesbar_kok";
const GILTIG_I_DAGAR = 30;

function hemlighet(): string {
  const losen = process.env.KITCHEN_DASHBOARD_PASSWORD;
  if (!losen) {
    throw new Error(
      "KITCHEN_DASHBOARD_PASSWORD saknas. Utan den går /kok inte att låsa upp.",
    );
  }
  return losen;
}

export function harKoksLosenord(): boolean {
  return Boolean(process.env.KITCHEN_DASHBOARD_PASSWORD);
}

async function signera(utgar: number): Promise<string> {
  const nyckel = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(hemlighet()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatur = await crypto.subtle.sign(
    "HMAC",
    nyckel,
    new TextEncoder().encode(String(utgar)),
  );
  return [...new Uint8Array(signatur)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function skapaKoksToken(): Promise<{
  varde: string;
  maxAlder: number;
}> {
  const maxAlder = GILTIG_I_DAGAR * 24 * 60 * 60;
  const utgar = Date.now() + maxAlder * 1000;
  return { varde: `${utgar}.${await signera(utgar)}`, maxAlder };
}

export async function tokenGiltig(token: string | undefined): Promise<boolean> {
  if (!token || !harKoksLosenord()) return false;

  const [utgarText, signatur] = token.split(".");
  const utgar = Number(utgarText);
  if (!Number.isFinite(utgar) || utgar < Date.now() || !signatur) return false;

  return jamforKonstantTid(signatur, await signera(utgar));
}

export function losenordStammer(inmatning: string): boolean {
  if (!harKoksLosenord()) return false;
  return jamforKonstantTid(inmatning, hemlighet());
}

/**
 * Jämförelsen måste ta lika lång tid oavsett var strängarna skiljer sig,
 * annars går hemligheten att gissa fram tecken för tecken.
 */
function jamforKonstantTid(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let skillnad = 0;
  for (let i = 0; i < ab.length; i++) skillnad |= ab[i] ^ bb[i];
  return skillnad === 0;
}
