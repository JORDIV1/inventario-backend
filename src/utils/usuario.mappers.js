const ORDER_MAP = {
  id: "id_usuario",
  nombre: "nombre",
  rolId: "rol_id",
  createdAt: "created_at",
};
const ORDERABLE = new Set(Object.values(ORDER_MAP));

export function normalizeOrderUsuario(orderBy = "created_at", orderDir = "DESC") {
  const mapped = ORDER_MAP[orderBy] || orderBy;
  const col = ORDERABLE.has(mapped) ? mapped : "created_at";
  const dir = String(orderDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
  return { col, dir };
}
