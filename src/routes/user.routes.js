import { pool } from "../config/pool.js";
import { Router } from "express";
import multer from "multer";
import { UserController } from "../controllers/userController.js";
import { UserService } from "../services/userService.js";
import { UsuarioRepository } from "../repositories/usuarioRepo.js";
import { requireRole } from "../middleware/authRol.js";
import { guard, ROLES } from "../security/roles.js";
const router = Router();

const usuarioRepository = new UsuarioRepository(pool);
const userService = new UserService(usuarioRepository);
const userController = new UserController(userService);

const upload = multer({
  storage: multer.memoryStorage(),
});

//solo admin#
router.get("/admin", guard, requireRole(ROLES.ADMIN), userController.listAdmin);
router.post("/admin", guard, requireRole(ROLES.ADMIN), userController.create);
router.patch("/admin/:id", guard, requireRole(ROLES.ADMIN), userController.updatedPartial);
router.delete("/admin/:id", guard, requireRole(ROLES.ADMIN), userController.remove);
//publicas

router.get("/public", guard, userController.listPublic);
router.post("/likes/toggle", guard, userController.toggleLike);
router.post("/me/avatar", guard, upload.single("avatar"), userController.updateAvatarFromR2);
router.get("/:id/avatar", guard, userController.getAvatar);

export const usuarioRouter = router;
