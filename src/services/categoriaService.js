import { Categoria } from "../models/categoria.js";
import { toPartialUpdateRowCategory } from "../utils/categoria.mappers.js";

export class CategoriaService {
  /**
   *
   * @param {import("../repositories/categoriaRepo.js").CategoriaRepository} repo
   */
  constructor(repo) {
    this.repo = repo;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.patch = this.patch.bind(this);
    this.remove = this.remove.bind(this);
  }

  async create(dto = {}) {
    const entidad = Categoria.fromJSON({ nombre: String(dto.nombre ?? "").trim() });

    let insertId;
    try {
      insertId = await this.repo.insert(entidad.toInsertRow());
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") {
        throw new Error("CATEGORY_DUPLICATE");
      }
      throw new Error("INTERNAL_ERROR");
    }
    if (!insertId) return null;
    const row = await this.repo.findById(insertId);
    if (!row) throw new Error("REGISTER_READ_BACK_FAILED");

    const rowFinal = Categoria.fromRow(row);

    return { categoria: rowFinal.toDTO() };
  }

  async getById(id) {
    if (!Number.isInteger(id) || id <= 0) return null;

    let row;
    try {
      row = await this.repo.findById(id);
    } catch {
      throw new Error("INTERNAL_ERROR");
    }
    if (!row) return null;

    const rowFinal = Categoria.fromRow(row);

    return { categoria: rowFinal.toDTO() };
  }

  async list(params = {}) {
    const limit = Number(params?.limit ?? 10);
    const offset = Number(params?.offset ?? 0);
    const orderBy = params?.orderBy ?? "created_at";
    const orderDir = params?.orderDir ?? "DESC";

    const rows = await this.repo.findAll({ limit, offset, orderBy, orderDir });

    const total = await this.repo.countAll();

    const rowFinal = rows.map((r) => Categoria.fromRow(r).toDTO());

    return { items: rowFinal, meta: { total, limit, offset, orderBy, orderDir } };
  }

  async patch(id, dtoParcial = {}) {
    if (!Number.isInteger(id) || id <= 0) return null;
    const rowExistente = await this.repo.findById(id);
    if (!rowExistente) return null;

    const actual = Categoria.fromRow(rowExistente);

    const nombre = dtoParcial.nombre != null ? String(dtoParcial.nombre).trim() : undefined;
    if (nombre === undefined) return false; //nada para cambiar
    if (!nombre) {
      throw new TypeError("CATEGORY_NAME_REQUIRED");
    }
    const merge = actual.withPatch({ nombre });
    const { setSql, params } = toPartialUpdateRowCategory(actual, merge);

    if (!setSql) return false;

    let affected;

    try {
      affected = await this.repo.updatePartial(id, setSql, params);
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") throw new Error("CATEGORY_DUPLICATE");
      throw new Error("INTERNAL_ERROR");
    }
    if (!affected) return false;
    const rowFinal = await this.repo.findById(id);
    if (!rowFinal) return null;
    const categoriaFinal = Categoria.fromRow(rowFinal);

    return { items: categoriaFinal.toDTO() };
  }

  async remove(id) {
    if (!Number.isInteger(id) || id <= 0) return null;
    let affected;
    try {
      affected = await this.repo.remove(id);
    } catch {
      throw new Error("INTERNAL_ERROR");
    }
    if (affected === 0) return null;

    return true; // eliminada
  }
}
