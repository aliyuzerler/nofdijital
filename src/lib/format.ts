/** TR tarih biçimi (client tarafı güvenli yardımcılar). */
const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function formatTrDateSafe(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  const ist = new Date(d.getTime() + 3 * 3600_000);
  return `${ist.getUTCDate()} ${TR_MONTHS[ist.getUTCMonth()]} ${ist.getUTCFullYear()}`;
}
