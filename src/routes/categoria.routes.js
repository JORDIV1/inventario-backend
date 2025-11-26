import { Router } from "express";
import { pool } from "../config/pool.js";
import { CategoriaController } from "../controllers/categoriaController.js";
import { CategoriaRepository } from "../repositories/categoriaRepo.js";
import { CategoriaService } from "../services/categoriaService.js";
import { requireRole } from "../middleware/authRol.js";
import { guard, ROLES } from "../security/roles.js";
const router = Router();

const categoriaRepository = new CategoriaRepository(pool);
const categoriaService = new CategoriaService(categoriaRepository);
const categoriaController = new CategoriaController(categoriaService);

//rutas publicas  protegidas
router.get("/", guard, categoriaController.list);
router.get("/:id", guard, categoriaController.getById);
//rutas admin
router.post("/", guard, requireRole(ROLES.ADMIN), categoriaController.create);
router.patch("/:id", guard, requireRole(ROLES.ADMIN), categoriaController.patch);
router.delete("/:id", guard, requireRole(ROLES.ADMIN), categoriaController.remove);
export const categoriaRouter = router;
