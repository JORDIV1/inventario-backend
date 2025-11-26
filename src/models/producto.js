import { ensure } from "../utils/ensure.js";

export class Producto {
  constructor({
    id = null,
    nombre,
    precioCents,
    stock,
    categoriaId = null,
    createdAt = null,
    updatedAt = null,
    categoriaNombre = null,
  }) {
    this.id = id ?? null;
    this.nombre = Producto.validarNombre(nombre);
    this.precioCents = Producto.validarPrecioCents(precioCents);
    this.stock = Producto.validarStock(stock);
    this.categoriaId = Producto.validarCategoriaId(categoriaId);
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
    this.categoriaNombre = categoriaNombre;
    Object.freeze(this);
  }

  //proveniente del frontend objeto plano para instancias de la clase
  static fromJSON(obj = {}) {
    return new this({
      nombre: obj.nombre,
      precioCents: obj.precioCents,
      stock: obj.stock,
      categoriaId: obj.categoriaId ?? null,
    });
  }
  //reconstruye la entidad de la bd snake_case → camelCase
  static fromRow(row) {
    if (!row) return null; //si no existe fila retorna null
    return new this({
      // SELECT id_producto AS id, tomará row.id; si no, usa id_producto
      id: row.id ?? row.id_producto ?? null,
      nombre: row.nombre,
      precioCents: row.precio_cents,
      stock: row.stock,
      categoriaId: row.categoria_id ?? null,
      categoriaNombre: row.categoria_nombre ?? null,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    });
  }
  //convierte la instancia camelCase a snake_case que entiende la BD, repo(insert.update) camelCase → snake_case
  toInsertRow() {
    return {
      nombre: this.nombre,
      precio_cents: this.precioCents,
      stock: this.stock,
      categoria_id: this.categoriaId,
    };
  }
  //elegimos que devolver como respuesta Entidad -> JSON respuesta
  toDTO() {
    return {
      id: this.id,
      nombre: this.nombre,
      precioCents: this.precioCents,
      precio: (this.precioCents / 100).toFixed(2),
      stock: this.stock,
      categoriaId: this.categoriaId,
      categoriaNombre: this.categoriaNombre,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  //genera otra instancia de req.body con los campos modificados respetando los que no Aplica cambios parciales de forma inmutable y validada
  withPatch(patch = {}) {
    //bloquear el intento de tocar el id
    if ("id" in patch && patch.id !== this.id) {
      throw new TypeError("no se permite cambiar el id");
    }
    return new this.constructor({
      id: this.id,
      nombre: patch.nombre ?? this.nombre,
      precioCents: patch.precioCents ?? this.precioCents,
      stock: patch.stock ?? this.stock,
      // algo nuevo Solo se actualiza si el campo realmente viene en el patch.
      categoriaId: Object.prototype.hasOwnProperty.call(patch, "categoriaId")
        ? patch.categoriaId
        : this.categoriaId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  //validacion de la clse soportan herencia
  static validarNombre(v) {
    ensure(typeof v == "string", TypeError, "PRODUCT_NAME_INVALID");
    const n = String(v).trim();
    ensure(n.length >= 3, RangeError, "PRODUCT_NAME_TOO_SHORT");
    return n;
  }
  static validarPrecioCents(v) {
    const nu = Number(v);
    ensure(Number.isInteger(nu), TypeError, "PRODUCT_PRICE_NOT_INTEGER");
    ensure(nu >= 0, RangeError, "PRODUCT_PRICE_NEGATIVE");
    return nu;
  }
  static validarStock(v) {
    const s = Number(v);
    ensure(Number.isInteger(s), TypeError, "STOCK_NOT_INTEGER");
    ensure(s >= 0, RangeError, "STOCK_NEGATIVE");
    return s;
  }

  static validarCategoriaId(v) {
    if (v == null) return null;
    const id = Number(v);
    ensure(Number.isInteger(id), TypeError, "CATEGORY_NOT_INTEGER");
    ensure(id > 0, RangeError, "CATEGORY_NEGATIVE");
    return id;
  }
}
