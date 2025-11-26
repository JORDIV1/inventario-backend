const ORDER_MAP = {
  id: "id_categoria",
  nombre: "nombre",
  createdAt: "created_at",
  updatedAt: "updated_at",
};
const ORDERABLE = new Set(Object.values(ORDER_MAP));

export function normalizeOrderCategoria(orderBy = "created_at", orderDir = "DESC") {
  const mapped = ORDER_MAP[orderBy] || orderBy;
  const col = ORDERABLE.has(mapped) ? mapped : "created_at";
  const dir = String(orderDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
  return { col, dir };
}

export function toPartialUpdateRowCategory(actualEnt, mergedEnt) {
  const params = [];
  const set = [];
  const MAP = {
    nombre: "nombre",
  };
  for (const key of Object.keys(MAP)) {
    const col = MAP[key];
    const newVal = mergedEnt[key];
    const oldVal = actualEnt[key];

    if (newVal !== undefined && newVal !== oldVal) {
      set.push(`${col} = ?`);
      params.push(newVal);
    }
  }
  return { setSql: set.join(", "), params };
}
