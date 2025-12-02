import { normalizeOrderMovimiento } from "../utils/movimiento.mappers.js";
import { limitPag } from "../utils/queryUtils.js";

export class MovimientoRepository {
  /**
   * @param {import('mysql2/promise').Pool} pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  async insert(rowSnake, conn) {
    const sql = `INSERT INTO movimientos (tipo, cantidad,
     producto_id, usuario_id, nota) 
     VALUES(?,?,?,?,?) `;

    const params = [
      rowSnake.tipo,
      rowSnake.cantidad,
      rowSnake.producto_id,
      rowSnake.usuario_id,
      rowSnake.nota,
    ];

    const executor = conn ?? this.pool;
    const [result] = await executor.execute(sql, params);

    return result.insertId;
  }

  async findHistorialConUsuarioYProductos({ orderBy, orderDir, limit, offset }, conn) {
    const { col, dir } = normalizeOrderMovimiento(orderBy, orderDir);
    const { L, O } = limitPag({ limit, offset });
    const sql = `SELECT 
    m.id_movimiento,
    m.tipo,
    m.cantidad,
    m.fecha,
    m.usuario_id,
    u.nombre AS usuario_nombre,
    m.producto_id,
    p.nombre AS producto_nombre,
    m.nota
    FROM movimientos AS m
    JOIN usuarios AS u ON u.id_usuario = m.usuario_id
    JOIN productos AS p ON p.id_producto = m.producto_id
    ORDER BY ${col} ${dir}
    LIMIT ${L} OFFSET ${O}
    `;
    const executor = conn ?? this.pool;
    const [rows] = await executor.execute(sql);

    return rows;
  }
  async findAllExport() {
    const sql = `SELECT 
    m.id_movimiento,
    m.fecha,
    m.tipo,
    m.cantidad,
    m.nota,
    p.nombre AS producto_nombre,
    u.nombre AS usuario_nombre
    FROM movimientos m
    JOIN productos p ON id_producto = m.producto_id
    JOIN usuarios u ON id_usuario = m.usuario_id
    ORDER BY m.fecha DESC
    `;
    const [rows] = await this.pool.execute(sql);
    return rows;
  }
  async countAll() {
    const sql = `SELECT COUNT(*) AS total FROM movimientos`;
    const [rows] = await this.pool.execute(sql);
    return Number(rows[0]?.total ?? 0);
  }
}
