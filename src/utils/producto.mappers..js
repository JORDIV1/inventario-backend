export const ORDER_MAP = {
  id: "p.id_producto",
  nombre: "p.nombre",
  precioCents: "p.precio_cents",
  stock: "p.stock",
  categoriaId: "p.categoria_id",
  createdAt: "p.created_at",
  updatedAt: "p.updated_at",
};

export const ORDERABLE = new Set(Object.values(ORDER_MAP));

export function normalizeOrderProducto(orderBy = "created_at", orderDir = "DESC") {
  //  Normaliza campo  de camel a snake case
  const mapped = ORDER_MAP[orderBy] || orderBy;
  const col = ORDERABLE.has(mapped) ? mapped : "p.created_at";
  const dir = String(orderDir).toUpperCase() === "ASC" ? "ASC" : "DESC";

  return { col, dir };
}

export const PATCHABLE_PRODUCT = new Set(["nombre", "precioCents", "stock", "categoriaId"]);

export function toPartialUpdateRow(actualEnt, mergedEnt) {
  const MAP = {
    nombre: "nombre",
    precioCents: "precio_cents",
    stock: "stock",
    categoriaId: "categoria_id",
  };

  const set = [];
  const params = [];

  for (const key of Object.keys(MAP)) {
    const col = MAP[key];
    const newVal = mergedEnt[key];
    const oldVal = actualEnt[key];
    // Solo incluir si cambió y no es undefined
    if (newVal !== undefined && newVal !== oldVal) {
      set.push(`${col} = ?`);
      params.push(newVal);
    }
  }
  return { setSql: set.join(", "), params };
}
