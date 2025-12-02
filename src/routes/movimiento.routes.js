import { pool } from "../config/pool.js";
import { Router } from "express";
import { MovimientoRepository } from "../repositories/movimientoRepo.js";
import { MovimientoService } from "../services/movimientoService.js";
import { MovimientoController } from "../controllers/movimientoController.js";
import { guard } from "../security/roles.js";
const router = Router();
const movimietoRepo = new MovimientoRepository(pool);
export const movimientoService = new MovimientoService(movimietoRepo);
const movimientoController = new MovimientoController(movimientoService);

router.get("/", guard, movimientoController.list);
router.get("/export", guard, movimientoController.getExportToCSV);
export const movimientoRouter = router;
