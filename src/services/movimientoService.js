import { Movimiento } from "../models/movimiento.js";
import { escapeCsv, formatFechaCsv } from "../utils/exportCsv.js";

export class MovimientoService {
  /**
   * @param {import ('../repositories/movimientoRepo.js').MovimientoRepository} repo*/
  constructor(repo) {
    this.repo = repo;
  }

  async registrarCambioDeStock({ tipo, cantidad, productoId, usuarioId, nota, conn } = {}) {
    const notaNormalizada =
      nota != undefined && String(nota).trim() !== ""
        ? String(nota).trim()
        : `Movimiento de ${tipo}`;

    const mov = new Movimiento({
      tipo,
      cantidad,
      productoId,
      usuarioId,
      nota: notaNormalizada,
    });
    return await this.repo.insert(mov.toInsertRow(), conn);
  }

  async list(params = {}) {
    try {
      const limit = params.limit ?? 10;
      const offset = params.offset ?? 0;
      const orderBy = params.orderBy ?? "fecha";
      const orderDir = params.orderDir ?? "DESC";

      const rows = await this.repo.findHistorialConUsuarioYProductos({
        orderBy,
        orderDir,
        limit,
        offset,
      });

      const total = await this.repo.countAll();

      const mov = rows.map((m) => Movimiento.fromRow(m));

      return {
        items: mov,
        meta: { total, limit, offset, orderBy, orderDir },
      };
    } catch (err) {
      throw new Error("MOV_LIST_REPO_UNAVAILABLE");
    }
  }

  async exportToCSV() {
    let rows;
    try {
      rows = await this.repo.findAllExport();
    } catch (err) {
      throw new Error("MOV_EXPORT_REPO_UNAVAILABLE");
    }
    const headers = ["id", "fecha", "producto", "tipo", "cantidad", "usuario", "nota"];

    const lines = [];

    lines.push(headers.join(";"));

    for (const row of rows) {
      const id = row.id_movimiento;
      const fecha = formatFechaCsv(row.fecha);
      const producto = row.producto_nombre;
      const tipo = row.tipo;
      const cantidad = row.cantidad;
      const usuario = row.usuario_nombre;
      const nota = row.nota;

      const rowCsv = [
        escapeCsv(id),
        escapeCsv(fecha),
        escapeCsv(producto),
        escapeCsv(tipo),
        escapeCsv(cantidad),
        escapeCsv(usuario),
        escapeCsv(nota),
      ].join(";");
      lines.push(rowCsv);
    }
    const csv = lines.join("\n");
    return csv;
  }
}
