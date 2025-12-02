const ORDER_MAP = {
  id: "m.id_movimiento",
  tipo: "m.tipo",
  fecha: "m.fecha",
  usuario: "u.nombre",
  producto: "p.nombre",
};

const ORDERABLE = new Set(Object.values(ORDER_MAP));

export function normalizeOrderMovimiento(orderBy = "fecha", orderDir = "DESC") {
  const mapped = ORDER_MAP[orderBy] || orderBy;
  const col = ORDERABLE.has(mapped) ? mapped : "m.fecha";
  const dir = String(orderDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
  return { col, dir };
}
