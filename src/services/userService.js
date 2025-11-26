import argon2 from "argon2";
import { Usuario } from "../models/user.js";
const EMAIL_REGEX = /^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{10,}$/;
const ROLES = new Set([1, 2]);
export class UserService {
  /**
   * @param {import("../repositories/usuarioRepo.js").UsuarioRepository} repo
   */
  constructor(repo) {
    this.repo = repo;
  }
  //para mis usuarios publicos
  async create(dto = {}) {
    const email = String(dto.email ?? "")
      .trim()
      .toLowerCase();
    const rowExistente = await this.repo.findByEmail(email);
    if (rowExistente) {
      throw new Error("EMAIL_TAKEN");
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new TypeError("EMAIL_INVALID");
    }
    const nombre = String(dto.nombre).trim();
    const rolId = Number(dto.rolId ?? 2);
    const raw = String(dto.password ?? "3");
    if (raw.length < 10) throw new RangeError("PASSWORD_TOO_SHORT");
    //al menos 1 mayúscula y 1 dígito
    if (!PASSWORD_REGEX.test(raw)) throw new RangeError("PASSWORD_WEAK");
    const base = Usuario.fromRegisterAdmin({ nombre, email, rolId });
    const hash = await argon2.hash(raw, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
    const conHash = base.withPasswordHash(hash);

    let insertId;
    try {
      insertId = await this.repo.insert(conHash.toInsertRow());
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") throw new Error("EMAIL_TAKEN");
      throw new Error("ERROR_CREATE_USER");
    }

    const rowFinal = await this.repo.findById(insertId);
    if (!rowFinal) {
      throw new Error("REGISTER_READ_BACK_FAILED");
    }
    const user = Usuario.fromRow(rowFinal).toAdminDTO();
    return {
      user,
    };
  }

  async updatedPartial(id, dto = {}) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new TypeError("INVALID_ID");
    }

    const currentRow = await this.repo.findById(id);
    if (!currentRow) return null;

    const patch = {};
    if (dto.nombre !== undefined) {
      const nombre = String(dto.nombre).trim();
      if (!nombre) {
        throw new TypeError("NAME_REQUIRED");
      }
      patch.nombre = nombre;
    }

    if (dto.email !== undefined) {
      const email = String(dto.email).trim().toLowerCase();
      if (!EMAIL_REGEX.test(email) || email.length > 30) {
        throw new TypeError("EMAIL_INVALID");
      }

      if (email !== currentRow.email) {
        const rowExistente = await this.repo.findByEmail(email);
        if (rowExistente) {
          throw new Error("EMAIL_TAKEN");
        }
      }
      patch.email = email;
    }

    if (dto.rolId !== undefined) {
      const rolId = Number(dto.rolId);
      if (!Number.isInteger(rolId) || !ROLES.has(rolId)) {
        throw new TypeError("ROL_INVALID");
      }
      patch.rol_id = rolId;
    }

    const fieldSnake = {};

    if (patch.nombre !== undefined) fieldSnake.nombre = patch.nombre;
    if (patch.email !== undefined) fieldSnake.email = patch.email;
    if (patch.rol_id !== undefined) fieldSnake.rol_id = patch.rol_id;

    if (Object.keys(fieldSnake).length === 0) return false;

    let affected;
    try {
      affected = await this.repo.updatePartial(id, fieldSnake);
    } catch {
      throw new Error("USER_REPO_UNAVAILABLE");
    }
    if (!affected) return false;

    const rowFinal = await this.repo.findById(id);

    if (!rowFinal) return null;

    const userFinal = Usuario.fromRowPatch(rowFinal).toAdminDTO();

    return {
      user: userFinal,
    };
  }
  async remove(id) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new TypeError("INVALID_ID");
    }
    const currentRow = await this.repo.findById(id);
    if (!currentRow) return null;

    let affected;
    try {
      affected = await this.repo.remove(id);
    } catch (err) {
      throw new Error("USER_REPO_UNAVAILABLE");
    }
    if (!affected) return false;

    return true;
  }
  async listPublic(params = {}) {
    const limit = Number(params?.limit ?? 10);
    const offset = Number(params?.offset ?? 0);
    const orderBy = params?.orderBy ?? "created_at";
    const orderDir = params?.orderDir ?? "DESC";

    const rows = await this.repo.listPublic({ limit, offset, orderBy, orderDir });

    const total = await this.repo.total();

    const items = rows.map((r) => ({
      id: r.id_usuario,
      nombre: r.nombre,
      rolId: r.rol_id,
      createdAt: r.created_at,
    }));
    return {
      items,
      meta: { total, limit, offset, orderBy, orderDir },
    };
  }

  async listAdmin(params = {}) {
    let limit = Number(params.limit ?? 10);
    let offset = Number(params.offset ?? 0);
    const orderBy = params.orderBy ?? "created_at";
    const orderDir = params.orderDir ?? "DESC";
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      limit = 10;
    }

    if (!Number.isInteger(offset) || offset < 0) {
      offset = 0;
    }
    const rows = await this.repo.listAdmin({ limit, offset, orderBy, orderDir });
    const total = await this.repo.total();
    const items = rows.map((r) => Usuario.fromRow(r).toAdminDTO());
    return {
      items,
      meta: { total, limit, offset, orderBy, orderDir },
    };
  }
}
