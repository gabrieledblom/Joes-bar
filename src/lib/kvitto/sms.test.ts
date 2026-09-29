import { describe, expect, it } from "vitest";
import { smsAvsandare } from "./sms";

describe("sms-avsändare", () => {
  it.each([
    ["Joe's Bar", "JoesBar"],
    ["Joes Bar Järna", "JoesBarJrna"],
    ["JoesBar", "JoesBar"],
    ["+46701234567", "+46701234567"],
    [undefined, "JoesBar"],
    ["", "JoesBar"],
    ["123", "JoesBar"],
  ])("gör %s till %s", (inmatning, forvantat) => {
    expect(smsAvsandare(inmatning)).toBe(forvantat);
  });

  it("håller sig inom 11 tecken", () => {
    expect(smsAvsandare("JoesBarJarnaPizzeria")).toHaveLength(11);
  });
});
