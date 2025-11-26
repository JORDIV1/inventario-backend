import { ensure } from "../utils/ensure.js";
const DEFAULT_ROLE_ID = 2;
export class Usuario {
  #passwordHash;
  constructor({
    id = null,
    nombre,
    email,
    passwordHash,
    rolId,
    createdAt = null,
    updatedAt = null,
  }) {
    this.id = id ?? null;
    this.nombre = Usuario.validarNombre(nombre);
    this.email = Usuario.validarEmail(email);
    this.#passwordHash = Usuario.validarPasswordHashNullable(passwordHash);
    this.rolId = Usuario.validarRolId(rolId);
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;

    Object.freeze(this);
  }

  static fromRegisterAdmin({ nombre, email, rolId = 2 }) {
    return new this({
      nombre: nombre,
      email: email,
      passwordHash: null,
      rolId: rolId,
    });
  }

  static fromRegisterJSON(obj) {
    return new this({
      nombre: obj.nombre,
      email: obj.email,
      passwordHash: null,
      //inmutable9
      rolId: DEFAULT_ROLE_ID,
    });
  }

  static fromRow(row) {
    if (!row) return null;
    return new this({
      id: row.id ?? row.id_usuario ?? null,
      nombre: row.nombre,
      email: row.email,
      passwordHash: row.password_hash,
      rolId: row.rol_id,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    });
  }

  static fromRowPatch(row) {
    if (!row) return null;
    return new this({
      id: row.id ?? row.id_usuario ?? null,
      nombre: row.nombre,
      email: row.email,
      rolId: row.rol_id,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    });
  }

  toInsertRow() {
    if (!this.tienePasswordHash()) {
      throw new Error("Falta password_hash para INSERT");
    }
    return {
      nombre: this.nombre,
      email: this.email,
      password_hash: this.#passwordHash,
      rol_id: this.rolId,
    };
  }

  toPublicDTO() {
    return {
      id: this.id,
      nombre: this.nombre,
      email: this.email,
      rolId: this.rolId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
  toAdminDTO() {
    return {
      id: this.id,
      nombre: this.nombre,
      email: this.email,
      rolId: this.rolId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
  //inmutable
  withPasswordHash(hash) {
    if (hash == null) return this;
    const newHash = Usuario.validarPasswordHashNullable(hash);
    return new this.constructor({
      id: this.id,
      nombre: this.nombre,
      email: this.email,
      passwordHash: newHash,
      rolId: this.rolId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  tienePasswordHash() {
    return this.#passwordHash != null;
  }

  static validarPasswordHashNullable(v) {
    if (v == null) return null;
    const pass = String(v);
    ensure(pass.length >= 20, RangeError, "PASSWORD_INVALID");
    return pass;
  }

  static validarNombre(v) {
    ensure(typeof v === "string", TypeError, "USER_NAME_NOT_STRING");
    const user = String(v).trim();
    ensure(user.length >= 3, RangeError, "USER_NAME_TOO_SHORT");
    return user;
  }

  static validarEmail(v) {
    ensure(typeof v === "string", TypeError, "EMAIL_INVALID");
    const e = String(v).trim().toLowerCase();
    ensure(/^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/.test(e), TypeError, "EMAIL_INVALID");
    return e;
  }

  static validarRolId(v) {
    const n = Number(v);
    ensure(Number.isInteger(n) && n > 0, TypeError, "ROL_INVALID");
    return n;
  }
}
