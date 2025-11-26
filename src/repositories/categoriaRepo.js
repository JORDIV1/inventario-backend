import { normalizeOrderCategoria } from "../utils/categoria.mappers.js";
import { limitPag } from "../utils/queryUtils.js";

export class CategoriaRepository {
  /**
   *
   * @param {import('mysql2/promise').Pool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }
  async insert(dto) {
    const sql = `INSERT INTO categorias (nombre) VALUES (?)`;
    const params = [dto.nombre];
    const [res] = await this.pool.execute(sql, params);
    return res.insertId;
  }
  async findById(id) {
    const sql = `SELECT id_categoria AS id, nombre, created_at, updated_at 
     FROM categorias  WHERE id_categoria = ? LIMIT 1`;
    const [rows] = await this.pool.execute(sql, [id]);
    return rows[0] ?? null;
  }

  async findAll({ limit = 10, offset = 0, orderBy = "created_at", orderDir = "DESC" }) {
    const { L, O } = limitPag({ limit, offset }); // SIEMPRE NUMERO - SIN RIESGO DE INYECCION
    const { col, dir } = normalizeOrderCategoria(orderBy, orderDir);
    const sql = `SELECT id_categoria AS id , nombre, created_at,updated_at FROM categorias ORDER BY ${col} ${dir} LIMIT ${L} OFFSET ${O} `;
    const [rows] = await this.pool.execute(sql);
    return rows;
  }

  async updatePartial(id, setSql, params) {
    if (!setSql) return 0;
    const sql = `UPDATE categorias  SET ${setSql} WHERE id_categoria = ? LIMIT 1`;
    const [res] = await this.pool.execute(sql, [...params, id]);
    return res.affectedRows;
  }
  async remove(id) {
    const sql = `DELETE FROM categorias WHERE id_categoria = ? LIMIT 1`;
    const [res] = await this.pool.execute(sql, [id]);
    return res.affectedRows;
  }

  async countAll() {
    const sql = `SELECT COUNT(*) AS total FROM categorias`;
    const [rows] = await this.pool.execute(sql);
    return Number(rows[0]?.total ?? 0);
  }
}
