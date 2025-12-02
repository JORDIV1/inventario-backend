import { ensure } from "../utils/ensure.js";
const TIPOS_MOVIMIENTO = new Set(["entrada", "salida"]);
export class Movimiento {
  constructor({
    id = null,
    tipo,
    cantidad,
    fecha = null,
    productoId,
    producto,
    usuarioId,
    usuario,
    nota,
  }) {
    this.id = id;
    this.producto = producto;
    this.usuario = usuario;
    this.tipo = Movimiento.verificarTipo(tipo);
    this.cantidad = Movimiento.verificarCantidad(cantidad);
    this.fecha = fecha ?? null;
    this.productoId = Movimiento.verificarProductoId(productoId);
    this.usuarioId = Movimiento.verificarUsuarioId(usuarioId);
    this.nota = Movimiento.verificarNota(nota);
  }

  static fromJSON(obj = {}) {
    return new this({
      tipo: obj.tipo,
      cantidad: obj.cantidad,
      fecha: obj.fecha,
      productoId: obj.productoId,
      usuarioId: obj.usuarioId,
      nota: obj.nota,
    });
  }
  static fromRow(row) {
    return new this({
      id: row.id_movimiento,
      tipo: row.tipo,
      cantidad: row.cantidad,
      fecha: row.fecha,
      productoId: row.producto_id,
      producto: row.producto_nombre,
      usuario: row.usuario_nombre,
      usuarioId: row.usuario_id,
      nota: row.nota,
    });
  }
  toInsertRow() {
    return {
      tipo: this.tipo,
      cantidad: this.cantidad,
      producto_id: this.productoId,
      usuario_id: this.usuarioId,
      nota: this.nota,
    };
  }
  static verificarCantidad(n) {
    const v = Number(n);
    ensure(Number.isInteger(v) && v > 0, RangeError, "CHECK_INVALID");
    return v;
  }
  static verificarProductoId(v) {
    const id = Number(v);
    ensure(Number.isInteger(id) && id > 0, RangeError, "PRODUCT_ID_INVALID");
    return id;
  }
  static verificarUsuarioId(v) {
    const id = Number(v);
    ensure(Number.isInteger(id) && id > 0, RangeError, "USER_ID_INVALID");
    return id;
  }
  static verificarTipo(n) {
    const v = String(n).trim().toLowerCase();

    ensure(TIPOS_MOVIMIENTO.has(v), TypeError, "ENUM_INVALID");
    return v;
  }
  static verificarNota(n) {
    if (n == null) return null;
    ensure(typeof n === "string", TypeError, "NOTA_INVALID");
    const v = String(n).trim();
    ensure(v.length <= 255, RangeError, "NOTA_NAME_TOO_LONG");
    return v;
  }
}
