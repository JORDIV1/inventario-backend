import { normalizeOrderProducto } from "../utils/producto.mappers..js";
import { limitPag } from "../utils/queryUtils.js";

// Mapa de columnas aceptadas (camelCase → snake_case)
//complejidad O(1) gracias a SET

export class ProductoRepository {
  /**@param {import('mysql2/promise').Pool} pool */
  constructor(pool) {
    this.pool = pool;
  }
  async insert(row, conn) {
    const sql = `INSERT INTO productos (nombre, precio_cents, stock, categoria_id)
               VALUES (?,?,?,?)`;
    const params = [row.nombre, row.precio_cents, row.stock, row.categoria_id];

    const executor = conn ?? this.pool;
    const [res] = await executor.execute(sql, params);
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

    const [rows] = await this.pool.execute(sql);

    return rows;
  }

  async findById(id, conn) {
    const sql = `SELECT id_producto AS id, nombre, precio_cents, stock, categoria_id,
    created_at, updated_at FROM productos WHERE id_producto = ? LIMIT 1
    `;
    const executor = conn ?? this.pool;
    const [rows] = await executor.execute(sql, [id]);
    return rows[0] ?? null;
  }

  async updatePartial(id, setSql, params, conn) {
    if (!setSql) return 0;

    const sql = `UPDATE productos SET ${setSql} WHERE id_producto = ?
    `;
    const executor = conn ?? this.pool;
    const [result] = await executor.execute(sql, [...params, id]);
    return result.affectedRows > 0;
  }

  async remove(id) {
    const sql = `DELETE FROM productos WHERE id_producto = ? LIMIT 1`;

    const [res] = await this.pool.execute(sql, [id]);

    return res.affectedRows > 0;
  }
  async findTopByPrecio(limit = 5) {
    const sql = `SELECT id_producto, nombre, precio_cents, stock, created_at, updated_at 
    FROM productos ORDER BY precio_cents DESC,
     id_producto ASC LIMIT ${limit}`;

    const [rows] = await this.pool.execute(sql);
    return rows;
  }

  async findTopPorValorTotal(limit = 5) {
    const sql = `SELECT  id_producto, nombre, precio_cents, stock, 
    (precio_cents * stock) AS valor_total,
    created_at,
    updated_at
    FROM productos
    ORDER BY valor_total DESC, id_producto ASC LIMIT ${limit}    
    `;
    const [rows] = await this.pool.execute(sql);

    return rows;
  }
  async findAllExport() {
    const sql = `SELECT 
    p.id_producto,
    p.nombre,
    p.precio_cents,
    p.stock,
    p.created_at,
    p.updated_at,
    c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON c.id_categoria = p.categoria_id
    ORDER BY p.created_at DESC
    `;

    const [rows] = await this.pool.execute(sql);
    return rows;
  }

  async countAll() {
    const sql = `SELECT COUNT(*) AS total FROM productos`;
    const [rows] = await this.pool.execute(sql);
    return Number(rows[0]?.total ?? 0);
  }
}
