import { pool } from "../config/pool.js";
import { Router } from "express";
import { ProductoController } from "../controllers/productoController.js";
import { ServicesProducto } from "../services/productoService.js";
import { ProductoRepository } from "../repositories/productoRepo.js";
import { requireRole } from "../middleware/authRol.js";
import { guard, ROLES } from "../security/roles.js";
import { movimientoService } from "./movimiento.routes.js";
const router = Router();
const productoRepo = new ProductoRepository(pool);
const productoService = new ServicesProducto(productoRepo, movimientoService);
const productoController = new ProductoController(productoService);

//redes publicas producto protegidas
// rutas específicas
router.get("/export", guard, productoController.getExportToCSV);
router.get("/top-caros", guard, productoController.getTopMasCaros);
router.get("/top-valor-total", guard, productoController.getTopPorValorTotal);
router.get("/", guard, productoController.list);

router.get("/:id", guard, productoController.getById);

/**
 * Rutas protegidas (solo ADMIN)
 * POST /productos
 * PATCH /productos/:id
 * DELETE /productos/:id
 */
router.post("/", guard, requireRole(ROLES.ADMIN), productoController.create);
router.patch("/:id", guard, requireRole(ROLES.ADMIN), productoController.update);
router.delete("/:id", guard, requireRole(ROLES.ADMIN), productoController.remove);

export const productoRouter = router;
