import { ensure } from "../utils/ensure.js";

export class Categoria {
  constructor({ id = null, nombre, createdAt = null, updatedAt = null }) {
    this.id = id ?? null;
    this.nombre = Categoria.verificarNombre(nombre);
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;

    Object.freeze(this);
  }
  static fromJSON(obj = {}) {
    return new this({
      nombre: obj.nombre,
    });
  }

  static fromRow(row) {
    if (!row) return null;
    return new this({
      id: row.id ?? row.id_categoria ?? null,
      nombre: row.nombre,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    });
  }

  toInsertRow() {
    return {
      nombre: this.nombre,
    };
  }

  withPatch(patch = {}) {
    if ("id" in patch && patch.id !== this.id) {
      throw new Error("CATEGORY_ID_IMMUTABLE");
    }
    return new this.constructor({
      id: this.id,
      nombre: patch.nombre != null ? Categoria.verificarNombre(patch.nombre) : this.nombre,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
  toDTO() {
    return {
      id: this.id,
      nombre: this.nombre,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static verificarNombre(n) {
    ensure(typeof n === "string", TypeError, "INVALID_NAME");
    const nombre = String(n).trim();
    ensure(nombre.length >= 3, RangeError, "CATEGORY_NAME_TOO_SHORT");
    ensure(nombre.length <= 100, RangeError, "CATEGORY_NAME_TOO_LONG");
    return nombre;
  }
}
