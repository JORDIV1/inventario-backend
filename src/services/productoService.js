import { Producto } from "../models/producto.js";
import { PATCHABLE_PRODUCT, toPartialUpdateRow } from "../utils/producto.mappers..js";
import { pool } from "../config/pool.js";
import { escapeCsv, formatFechaCsv } from "../utils/exportCsv.js";
export class ServicesProducto {
  /**
   * @param {import('../repositories/productoRepo.js').ProductoRepository} repo
   * @param {import('../services/movimientoService.js').MovimientoService} movimientosService
   */ constructor(repo, movimientosService) {
    this.repo = repo;
    this.movimientosService = movimientosService;
  }

  async create(usuarioId, dto, notaMovimiento) {
    const entidad = Producto.fromJSON(dto);
    const conn = await pool.getConnection();
    try {
      // Iniciar transacción
      await conn.beginTransaction();
      const insertId = await this.repo.insert(entidad.toInsertRow(), conn);

      const rowFinal = await this.repo.findById(insertId, conn);
      if (!rowFinal) {
        await conn.rollback();
        throw new Error("REGISTER_READ_BACK_FAILED");
      }
      if (rowFinal.stock > 0) {
        await this.movimientosService.registrarCambioDeStock({
          tipo: "entrada",
          cantidad: rowFinal.stock,
          productoId: insertId,
          usuarioId,
          nota: notaMovimiento,
          conn,
        });
      }
      await conn.commit();
      const productoFinal = Producto.fromRow(rowFinal);
      return { producto: productoFinal.toDTO() };
    } catch (err) {
      try {
        await conn.rollback();
      } catch {
        //
      }
      console.error("ERROR EN PRODUCTO SERVICE create:", err);
      if (err?.code === "ER_NO_REFERENCED_ROW_2") {
        throw new Error("CATEGORY_NOT_FOUND");
      }
      if (err?.code === "ER_DUP_ENTRY") {
        throw new Error("PRODUCT_DUPLICATE");
      }
      throw new Error("INTERNAL_ERROR");
    } finally {
      conn.release();
    }
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

  async patch(id, dtoParcial = {}, usuarioId, notaMovimiento) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      //Leer producto actual usando la misma conn
      const rowExistente = await this.repo.findById(id, conn);
      if (!rowExistente) {
        await conn.rollback(); // cerramos la transacción
        return null; // producto no existe
      }
      const actual = Producto.fromRow(rowExistente);
      const dto = {
        nombre: dtoParcial.nombre != null ? String(dtoParcial.nombre).trim() : undefined,
        precioCents: dtoParcial.precioCents != null ? Number(dtoParcial.precioCents) : undefined,
        stock: dtoParcial.stock != null ? Number(dtoParcial.stock) : undefined,
        categoriaId:
          dtoParcial.categoriaId == null
            ? null
            : Number(dtoParcial.categoriaId) === 0
              ? null // 0 es sin categoría
              : Number(dtoParcial.categoriaId),
      };
      const cambios = {};
      for (const key of Object.keys(dto)) {
        if (dto[key] !== undefined && PATCHABLE_PRODUCT.has(key)) {
          cambios[key] = dto[key];
        }
      }

      if (Object.keys(cambios).length === 0) {
        await conn.rollback();
        return false;
      }
      const merge = actual.withPatch(cambios);

      // Diferencia de stock solo si vino stock en cambios
      let diferenciaStock = 0;
      if (Object.prototype.hasOwnProperty.call(cambios, "stock")) {
        diferenciaStock = merge.stock - actual.stock;
      }

      const { setSql, params } = toPartialUpdateRow(actual, merge);
      if (!setSql) {
        await conn.rollback();
        return false;
      }
      const affected = await this.repo.updatePartial(id, setSql, params, conn);
      if (!affected) {
        await conn.rollback();
        return false;
      }
      //Si cambió el stock - registrar movimiento
      if (diferenciaStock !== 0) {
        const tipo = diferenciaStock > 0 ? "entrada" : "salida";
        const cantidad = Math.abs(diferenciaStock);
        await this.movimientosService.registrarCambioDeStock({
          tipo,
          cantidad,
          productoId: id,
          usuarioId,
          nota: notaMovimiento,
          conn,
        });
      }
      const rowFinal = await this.repo.findById(id, conn);
      if (!rowFinal) {
        await conn.rollback();
        throw new Error("REGISTER_READ_BACK_FAILED");
      }
      await conn.commit();

      const productoFinal = Producto.fromRow(rowFinal);
      return { producto: productoFinal.toDTO() };
    } catch (err) {
      try {
        await conn.rollback();
      } catch {
        // si falla el rollback lo ignoramos
      }
      if (err?.code === "ER_NO_REFERENCED_ROW_2") {
        throw new Error("CATEGORY_NOT_FOUND");
      }
      if (err?.code === "ER_DUP_ENTRY") {
        throw new Error("PRODUCT_DUPLICATE");
      }

      throw new Error("INTERNAL_ERROR");
    } finally {
      conn.release();
    }
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

  async topMasCaros(limit = 5) {
    const rows = await this.repo.findTopByPrecio(limit);

    const rowFinal = rows.map((r) => Producto.fromRow(r).toDTO());

    return { items: rowFinal };
  }

  async topPorValorTotal(limit = 5) {
    const rows = await this.repo.findTopPorValorTotal(limit);

    const rowFinal = rows.map((r) => {
      const dto = Producto.fromRow(r).toDTO();
      return {
        ...dto,
        valorTotal: Number(r.valor_total),
      };
    });

    return { items: rowFinal };
  }

  async exportToCSV() {
    let rows;
    try {
      rows = await this.repo.findAllExport();
    } catch (err) {
      throw new Error("PRODUCT_EXPORT_REPO_UNAVAILABLE");
    }
    const headers = ["id", "nombre", "precio", "stock", "categoria", "creado", "actualizado"];
    const lines = [];
    lines.push(headers.join(";"));
    for (const row of rows) {
      const id = row.id_producto;
      const nombre = row.nombre;
      const precio = Number(row.precio_cents) / 100;
      const stock = row.stock;
      const categoria = row.categoria_nombre ?? "sin categoria";
      const creado = formatFechaCsv(row.created_at);
      const actualizado = formatFechaCsv(row.updated_at);

      const rowCsv = [
        escapeCsv(id),
        escapeCsv(nombre),
        escapeCsv(precio),
        escapeCsv(stock),
        escapeCsv(categoria),
        escapeCsv(creado),
        escapeCsv(actualizado),
      ].join(";");
      lines.push(rowCsv);
    }
    const csv = lines.join("\n");
    return csv;
  }
}
