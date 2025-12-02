import { mapDomainErrorToHttp } from "../http/mapDomainErrorToHttp.js";

function whitelistCreate(body) {
  const nombre = String(body?.nombre ?? "").trim();
  const precioCents = Number(body?.precioCents);
  const stock = Number(body?.stock);
  // null = sin categoría; 0 también lo normalizamos a null
  const rawCat = body?.categoriaId;
  const categoriaId =
    rawCat === null || rawCat === "" || Number(rawCat) === 0 ? null : Number(rawCat);
  return { nombre, precioCents, stock, categoriaId };
}

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
const isIntMin = (v, min = 0) => Number.isInteger(v) && v >= min;

export class ProductoController {
  /**
   * @param {import("../services/productoService.js").ServicesProducto} productoService}
   */
  constructor(productoService) {
    this.serv = productoService;
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.getTopMasCaros = this.getTopMasCaros.bind(this);
    this.getTopPorValorTotal = this.getTopPorValorTotal.bind(this);
    this.getExportToCSV = this.getExportToCSV.bind(this);
    if (!productoService) {
      throw new Error("Error requiere ServiceProducto");
    }
  }
  async create(req, res) {
    try {
      const dto = whitelistCreate(req.body);
      const usuarioId = req.user.id;
      const notaMovimiento = req.body.nota ?? null;

      // Presencia + tipos/rangos básicos
      if (!dto.nombre) return res.status(400).json({ ok: false, error: "PRODUCT_NAME_REQUIRED" });
      if (!isIntMin(dto.precioCents))
        return res.status(400).json({ ok: false, error: "PRODUCT_PRICE_INVALID" });
      if (!isIntMin(dto.stock))
        return res.status(400).json({ ok: false, error: "PRODUCT_STOCK_INVALID" });
      if (!(dto.categoriaId === null || isIntMin(dto.categoriaId, 1)))
        return res.status(400).json({ ok: false, error: "PRODUCT_CATEGORY_INVALID" });

      const { producto } = await this.serv.create(usuarioId, dto, notaMovimiento);
      return res.status(201).json({ ok: true, producto });
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

  async update(req, res) {
    try {
      const usuarioId = req.user.id;
      const notaMovimiento = req.body.nota ?? null;
      const id = Number(req.params?.id);
      if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ ok: false, error: "INVALID_ID" });

      const dto = {
        nombre: req.body?.nombre,
        precioCents: req.body?.precioCents,
        stock: req.body?.stock,
        categoriaId: req.body?.categoriaId,
      };

      const out = await this.serv.patch(id, dto, usuarioId, notaMovimiento);
      if (out === null) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      if (out === false) return res.status(200).json({ ok: true, changed: false });

      return res.status(200).json({ ok: true, producto: out.producto });
    } catch (err) {
      console.error("[PRODUCTS_PATCH_ERROR]", err.code, err.message, err.stack);
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }
  async getById(req, res) {
    try {
      const id = Number(req.params?.id);
      if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ ok: false, error: "INVALID_ID" });
      const out = await this.serv.getById(id);
      if (out === null) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      return res.status(200).json({ ok: true, producto: out.producto });
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

  async getTopMasCaros(req, res) {
    try {
      const limit = Number(req.query?.limit ?? 5);
      if (!Number.isInteger(limit) || limit <= 0 || limit > 5) {
        return res.status(400).json({ ok: false, error: "INVALID_PAYLOAD" });
      }
      const { items } = await this.serv.topMasCaros(limit);
      return res.status(200).json({ ok: true, items });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }

  async getTopPorValorTotal(req, res) {
    try {
      const limit = Number(req.query?.limit ?? 5);
      if (!Number.isInteger(limit) || limit <= 0 || limit > 5) {
        return res.status(400).json({ ok: false, error: "INVALID_PAYLOAD" });
      }
      const { items } = await this.serv.topPorValorTotal(limit);

      return res.status(200).json({ ok: true, items });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }

  async getExportToCSV(req, res) {
    try {
      const csv = await this.serv.exportToCSV();
      const today = new Date().toISOString().slice(0, 10);
      const filename = `productos-${today}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send("\uFEFF" + csv);
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "CSV_PRODUCT_ERROR" });
    }
  }
}
