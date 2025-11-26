import { pool } from "../config/pool.js";
import { Router } from "express";
import { UserController } from "../controllers/userController.js";
import { UserService } from "../services/userService.js";
import { UsuarioRepository } from "../repositories/usuarioRepo.js";
import { requireRole } from "../middleware/authRol.js";
import { guard, ROLES } from "../security/roles.js";
const router = Router();

const usuarioRepository = new UsuarioRepository(pool);
const userService = new UserService(usuarioRepository);
const userController = new UserController(userService);

//solo admin
router.post("/admin", guard, requireRole(ROLES.ADMIN), userController.create);
router.patch("/admin/:id", guard, requireRole(ROLES.ADMIN), userController.updatedPartial);
router.get("/admin", guard, requireRole(ROLES.ADMIN), userController.listAdmin);
router.delete("/admin/:id", guard, requireRole(ROLES.ADMIN), userController.remove);
//publicas
router.get("/public", guard, userController.listPublic);

export const usuarioRouter = router;
