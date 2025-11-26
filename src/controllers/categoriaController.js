import { mapDomainErrorToHttp } from "../http/mapDomainErrorToHttp.js";

function whitelistListParams(query) {
  return {
    limit: Number(query?.limit ?? 10),
    offset: Number(query?.offset ?? 0),
    orderBy: String(query?.orderBy ?? "created_at").trim(),
    orderDir: String(query?.orderDir ?? "DESC")
      .trim()
      .toUpperCase(),
  };
}

export class CategoriaController {
  /**
   * @param {import("../services/categoriaService.js").CategoriaService} categoriaService
   */
  constructor(categoriaService) {
    this.serv = categoriaService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.patch = this.patch.bind(this);
    this.remove = this.remove.bind(this);
  }
  async create(req, res) {
    try {
      console.log(req.body?.nombre);
      const nombre = String(req.body?.nombre ?? "").trim();

      if (!nombre) return res.status(400).json({ ok: false, error: "CATEGORY_NAME_REQUIRED" });
      const out = await this.serv.create({ nombre });
      return res.status(201).json({ ok: true, categoria: out.categoria });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }

  async getById(req, res) {
    try {
      const id = Number(req.params?.id);
      if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ ok: true, error: "INVALID_ID" });
      const out = await this.serv.getById(id);
      if (out === null) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      return res.status(200).json({ ok: true, categoria: out.categoria });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }
  async list(req, res) {
    try {
      const params = whitelistListParams(req.query);
      const { items, meta } = await this.serv.list(params);

      return res.status(200).json({ ok: true, items, meta });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }

  async patch(req, res) {
    try {
      const id = Number(req.params?.id);
      if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ ok: false, error: "INVALID_ID" });
      const dtoParcial = { nombre: req.body?.nombre };
      const out = await this.serv.patch(id, dtoParcial);
      if (out === false) return res.status(200).json({ ok: true, changed: false });
      if (out === null) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      return res.status(200).json({ ok: true, items: out.items });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }
  async remove(req, res) {
    try {
      const id = Number(req.params?.id);
      if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ ok: false, error: "INVALID_ID" });
      const result = await this.serv.remove(id);
      if (result === null) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      return res.status(204).end();
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }
}
