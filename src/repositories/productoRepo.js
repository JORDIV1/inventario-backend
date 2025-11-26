import { normalizeOrderProducto } from "../utils/producto.mappers..js";
import { limitPag } from "../utils/queryUtils.js";

// Mapa de columnas aceptadas (camelCase → snake_case)
//complejidad O(1) gracias a SET

export class ProductoRepository {
  /**@param {import('mysql2/promise').Pool} pool */
  constructor(pool) {
    this.pool = pool;
  }
  async insert(entidad) {
    const sql = `INSERT INTO productos (nombre, precio_cents, stock, categoria_id)
    VALUES(?,?,?,?)
    `;
    const params = [
      entidad.nombre,
      entidad.precio_cents,
      entidad.stock,
      entidad.categoria_id ?? null,
    ];

    const [res] = await this.pool.execute(sql, params);
    return res.insertId;
  }
  //read list + paginacion
  async findAll({ limit = 10, offset = 0, orderBy = "created_at", orderDir = "desc" } = {}) {
    const { L, O } = limitPag({ limit, offset });
    const { col, dir } = normalizeOrderProducto(orderBy, orderDir);
    const sql = `
  SELECT 
    p.id_producto,
    p.nombre,
    p.precio_cents,
    p.stock,
    p.categoria_id,
    p.created_at,
    p.updated_at,
    c.nombre AS categoria_nombre
  FROM productos AS p
  LEFT JOIN categorias AS c
    ON c.id_categoria = p.categoria_id
  ORDER BY ${col} ${dir}
  LIMIT ${L} OFFSET ${O};
`;

    const [rows] = await this.pool.execute(sql, [L, O]);

    return rows;
  }

  async findById(id) {
    const sql = `SELECT id_producto AS id, nombre, precio_cents, stock, categoria_id,
    created_at, updated_at FROM productos WHERE id_producto = ? LIMIT 1
    `;
    const [rows] = await this.pool.execute(sql, [id]);

    return rows[0] ?? null;
  }

  async updatePartial(id, setSql, params) {
    if (!setSql) return 0;

    const sql = `UPDATE productos SET ${setSql} WHERE id_producto = ?
    `;

    const [res] = await this.pool.execute(sql, [...params, id]);

    return res.affectedRows > 0; //booleano
  }

  async remove(id) {
    const sql = `DELETE FROM productos WHERE id_producto = ? LIMIT 1`;

    const [res] = await this.pool.execute(sql, [id]);

    return res.affectedRows > 0;
  }

  async countAll() {
    const sql = `SELECT COUNT(*) AS total FROM productos`;
    const [rows] = await this.pool.execute(sql);
    return Number(rows[0]?.total ?? 0); 
  }
}
