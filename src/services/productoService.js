import { Producto } from "../models/producto.js";
import { PATCHABLE_PRODUCT, toPartialUpdateRow } from "../utils/producto.mappers..js";

export class ServicesProducto {
  /**
   * @param {import('../repositories/productoRepo.js').ProductoRepository} repo
   */ constructor(repo) {
    this.repo = repo;
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.patch = this.patch.bind(this);
    this.remove = this.remove.bind(this);
  }

  async create(dto) {
    // Construye entidad (valida invariantes de dominio)
    const entidad = Producto.fromJSON(dto);

    // Inserta (traduce errores de BD a errores de dominio)
    let insertId;
    try {
      insertId = await this.repo.insert(entidad.toInsertRow());
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") {
        throw new Error("PRODUCT_DUPLICATE");
      }
      if (err?.code === "ER_NO_REFERENCED_ROW_2") {
        // FK de categoria no existe
        throw new Error("CATEGORY_NOT_FOUND");
      }
      //LOG generico
      throw new Error("INTERNAL_ERROR");
    }

    // Read-back
    const rowFinal = await this.repo.findById(insertId);
    if (!rowFinal) throw new Error("REGISTER_READ_BACK_FAILED");

    const productoFinal = Producto.fromRow(rowFinal);

    return {
      producto: productoFinal.toDTO(),
    };
  }

  async list(params = {}) {
    const limit = Number(params?.limit ?? 10);
    const offset = Number(params?.offset ?? 0);
    const orderBy = params?.orderBy ?? "created_at";
    const orderDir = params?.orderDir ?? "DESC";
    const rows = await this.repo.findAll({ limit, offset, orderBy, orderDir });
    const total = await this.repo.countAll();
    //fila - entidad  -DTO
    const items = rows.map((row) => Producto.fromRow(row).toDTO());
    // 5) Meta consistente para el front
    return { items, meta: { total, limit, offset, orderBy, orderDir } };
  }

  //En PATCH/UPDATE necesitas el tercer estado (no tocar) ⇒ undefined.
  async patch(id, dtoParcial = {}) {
    const rowExistente = await this.repo.findById(id);
    if (!rowExistente) return null;

    const actual = Producto.fromRow(rowExistente);
    //normalizar dto
    const dto = {
      nombre: dtoParcial.nombre != null ? String(dtoParcial.nombre).trim() : undefined,
      precioCents: dtoParcial.precioCents != null ? Number(dtoParcial.precioCents) : undefined,
      stock: dtoParcial.stock != null ? Number(dtoParcial.stock) : undefined,
      categoriaId:
        dtoParcial.categoriaId == null
          ? undefined
          : Number(dtoParcial.categoriaId) === 0
            ? null // 0 es sin categoría
            : Number(dtoParcial.categoriaId),
    };
    //aplica whitelist
    const cambios = {};
    for (const key of Object.keys(dto)) {
      if (dto[key] !== undefined && PATCHABLE_PRODUCT.has(key)) {
        cambios[key] = dto[key];
      }
    }
    if (Object.keys(cambios).length === 0) return false;

    const merge = actual.withPatch(cambios);

    //SET
    const { setSql, params } = toPartialUpdateRow(actual, merge);

    if (!setSql) return false;

    let affected;
    try {
      affected = await this.repo.updatePartial(id, setSql, params);
    } catch (err) {
      if (err?.code === "ER_NO_REFERENCED_ROW_2") throw new Error("CATEGORY_NOT_FOUND");
      if (err?.code === "ER_DUP_ENTRY") throw new Error("PRODUCT_DUPLICATE");
      throw new Error("INTERNAL_ERROR");
    }
    if (!affected) return false;
    const rowFinal = await this.repo.findById(id);
    const productoFinal = Producto.fromRow(rowFinal);

    return { producto: productoFinal.toDTO() };
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
    const entidad = Producto.fromRow(row);
    return { producto: entidad.toDTO() };
  }

  async remove(id) {
    if (!Number.isInteger(id) || id <= 0) return null;

    try {
      const affected = await this.repo.remove(id);
      if (!affected) return null;
      return true;
    } catch (err) {
      if (err?.code === "ER_ROW_IS_REFERENCED_2") {
        throw new Error("PRODUCT_IN_USE"); //FK_CONFLICT
      }
      throw new Error("INTERNAL_ERROR");
    }
  }
}
