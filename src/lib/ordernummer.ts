/**
 * Ordernummer som går att ropa upp i en bar: fyra siffror, lätt att läsa
 * högt och att skilja åt på en köksskärm. Prefixet gör att gästen ser att
 * det hör till Joe's Bar i sms:et.
 */
export function nyttOrdernummer(): string {
  const siffror = Math.floor(1000 + Math.random() * 9000);
  return `JB-${siffror}`;
}
