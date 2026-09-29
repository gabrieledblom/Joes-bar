import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/lib/db/schema";

const epost = vi.fn<(o: Order) => Promise<boolean>>();
const sms = vi.fn<(o: Order) => Promise<boolean>>();

vi.mock("./epost", () => ({
  skickaEpostKvitto: (o: Order) => epost(o),
  skickaEpostAterbetald: (o: Order) => epost(o),
}));
vi.mock("./sms", () => ({
  skickaSmsKvitto: (o: Order) => sms(o),
  skickaSmsAterbetald: (o: Order) => sms(o),
}));

const { skickaKvitto, meddelaAterbetald } = await import("./index");

function order(kundEpost: string | null, kundTelefon: string | null) {
  return { kundEpost, kundTelefon } as Order;
}

beforeEach(() => {
  epost.mockReset().mockResolvedValue(true);
  sms.mockReset().mockResolvedValue(true);
});

describe("ett meddelande till gästen, inte två", () => {
  it("skickar bara e-post när gästen angett både e-post och mobil", async () => {
    expect(await skickaKvitto(order("a@b.se", "+46701234567"))).toEqual({
      epost: true,
      sms: false,
    });
    expect(sms).not.toHaveBeenCalled();
  });

  it("skickar sms när gästen bara angett mobil", async () => {
    expect(await skickaKvitto(order(null, "+46701234567"))).toEqual({
      epost: false,
      sms: true,
    });
    expect(epost).not.toHaveBeenCalled();
  });

  it("faller tillbaka på sms om e-posten inte går iväg", async () => {
    epost.mockResolvedValue(false);
    expect(await skickaKvitto(order("a@b.se", "+46701234567"))).toEqual({
      epost: false,
      sms: true,
    });
  });

  it("kastar aldrig, även om utskicket gör det", async () => {
    epost.mockRejectedValue(new Error("nätverk"));
    sms.mockRejectedValue(new Error("nätverk"));
    const fel = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await meddelaAterbetald(order("a@b.se", "+46701234567"))).toEqual({
      epost: false,
      sms: false,
    });
    fel.mockRestore();
  });

  it("gäller även beskedet om återbetalning", async () => {
    await meddelaAterbetald(order("a@b.se", "+46701234567"));
    expect(epost).toHaveBeenCalledOnce();
    expect(sms).not.toHaveBeenCalled();
  });
});
