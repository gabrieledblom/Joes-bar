import { Resend } from "resend";
import type { Order } from "@/lib/db/schema";
import { orenTillKronor } from "@/lib/pengar";
import { bestallning, restaurang } from "@/data/restaurang";

/**
 * E-postkvitto via Resend. Utan API-nyckel loggas innehållet i stället,
 * precis som sms-kvittot, så att flödet går att testa utan konto.
 */
export async function skickaEpostKvitto(order: Order): Promise<boolean> {
  if (!order.kundEpost) return false;

  const nyckel = process.env.RESEND_API_KEY;
  const fran = process.env.RESEND_FROM ?? "Joe's Bar <kvitto@joesbar.se>";
  const amne = `Kvitto för order ${order.ordernummer}`;

  if (!nyckel) {
    console.info(
      `[Resend mock] Till ${order.kundEpost}: ${amne}\n${textversion(order)}`,
    );
    return false;
  }

  const { error } = await new Resend(nyckel).emails.send({
    from: fran,
    to: order.kundEpost,
    subject: amne,
    text: textversion(order),
    html: htmlversion(order),
  });

  if (error) {
    console.error("Resend kunde inte skicka kvittot", error);
    return false;
  }
  return true;
}

function hamtningsrad(order: Order): string {
  return order.typ === "bord"
    ? `Serveras till bord ${order.bordsnummer}.`
    : `Klart för avhämtning efter cirka ${bestallning.tillagningsminuter} minuter.`;
}

function textversion(order: Order): string {
  const rader = order.rader
    .map((r) => {
      const tillagg = [
        r.protein,
        r.tillbehor,
        r.sideNamn ? `Med ${r.sideNamn}` : null,
        r.notering,
      ]
        .filter(Boolean)
        .join(", ");
      return `${r.antal} x ${r.namn}${tillagg ? ` (${tillagg})` : ""}  ${orenTillKronor(r.styckprisOren * r.antal)} kr`;
    })
    .join("\n");

  return [
    `Tack för din beställning hos ${restaurang.namn}.`,
    ``,
    `Ordernummer: ${order.ordernummer}`,
    ``,
    rader,
    ``,
    `Summa: ${orenTillKronor(order.summaOren)} kr`,
    hamtningsrad(order),
    ``,
    restaurang.telefon ? `Frågor? Ring ${restaurang.telefon}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function htmlversion(order: Order): string {
  const rader = order.rader
    .map((r) => {
      const tillagg = [
        r.protein,
        r.tillbehor,
        r.sideNamn ? `Med ${r.sideNamn}` : null,
        r.notering,
      ]
        .filter(Boolean)
        .join(", ");
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e6e1ec">
          ${r.antal} &times; ${escapeHtml(r.namn)}
          ${tillagg ? `<br><span style="color:#6b6377;font-size:13px">${escapeHtml(tillagg)}</span>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e6e1ec;text-align:right;white-space:nowrap">
          ${orenTillKronor(r.styckprisOren * r.antal)} kr
        </td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="sv"><body style="margin:0;background:#f5f2f8;font-family:system-ui,-apple-system,Segoe UI,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff">
    <p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#d81c6e">
      ${escapeHtml(restaurang.namn)}
    </p>
    <h1 style="margin:8px 0 0;font-size:24px;color:#14101c">Tack för din beställning</h1>
    <p style="margin:16px 0 0;font-size:15px;color:#4a4356">
      Ordernummer <strong style="color:#14101c">${escapeHtml(order.ordernummer)}</strong>
    </p>

    <table style="width:100%;margin-top:24px;border-collapse:collapse;font-size:15px;color:#14101c">
      ${rader}
      <tr>
        <td style="padding:14px 0 0;font-weight:600">Summa</td>
        <td style="padding:14px 0 0;text-align:right;font-weight:600">
          ${orenTillKronor(order.summaOren)} kr
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:15px;color:#4a4356">${escapeHtml(hamtningsrad(order))}</p>
    ${
      restaurang.telefon
        ? `<p style="margin:8px 0 0;font-size:14px;color:#6b6377">Frågor? Ring ${escapeHtml(restaurang.telefon)}.</p>`
        : ""
    }
  </div>
</body></html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
