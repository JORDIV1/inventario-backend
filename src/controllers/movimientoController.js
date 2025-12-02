import { mapDomainErrorToHttp } from "../http/mapDomainErrorToHttp.js";

function whitelistListParams(query) {
  return {
    limit: Number(query?.limit ?? 10),
    offset: Number(query?.offset ?? 0),
    orderBy: String(query?.orderBy ?? "fecha")
      .trim()
      .toLowerCase(),
    orderDir: String(query?.orderDir ?? "DESC").toUpperCase(),
  };
}

export class MovimientoController {
  /**
   *
   * @param {import('../services/movimientoService').MovimientoService} serv
   */
  constructor(serv) {
    this.serv = serv;
    this.list = this.list.bind(this);
    this.getExportToCSV = this.getExportToCSV.bind(this);
  }

  async list(req, res) {
    try {
      const params = whitelistListParams(req.query);
      const { items, meta } = await this.serv.list(params);

      return res.status(200).json({ ok: true, items, meta });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "MOV_LIST_ERROR" });
    }
  }

  async getExportToCSV(req, res) {
    try {
      const csv = await this.serv.exportToCSV();
      const today = new Date().toISOString().slice(0, 10);
      const filename = `movimientos-${today}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send("\uFEFF" + csv);
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "CSV_MOV_ERROR" });
    }
  }
}
