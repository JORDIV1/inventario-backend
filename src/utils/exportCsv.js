export function formatFechaCsv(fechaValue) {
  if (!fechaValue) return;
  if (fechaValue instanceof Date) {
    const iso = fechaValue.toISOString().slice(0, 19);
    return iso.replace("T", " ");
  }
  return String(fechaValue);
}
/**
 * Escapa un valor para CSV:
 * - Convierte null/undefined a ""
 * - Rodea con comillas si hay comas, saltos de línea o comillas
 * - Duplica comillas internas según la especificación CSV
 */
export function escapeCsv(value) {
  if (value == null) return "";
  const str = String(value);

  if (/[",\n\r]/.test(str)) {
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return str;
}
