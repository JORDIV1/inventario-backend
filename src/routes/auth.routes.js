import { pool } from "../config/pool.js";
import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { AuthService } from "../services/authService.js";

import { UsuarioRepository } from "../repositories/usuarioRepo.js";
import { jwtService } from "../security/index.js";
import { guard } from "../security/roles.js";
const router = Router();

const usuarioRepository = new UsuarioRepository(pool);
const authService = new AuthService(usuarioRepository, jwtService);
const authController = new AuthController(authService);

// Rutas públicas
router.post("/register", authController.register);
router.post("/login", authController.login);

// Refresh (usa cookie refresh_token)
router.post("/refresh", authController.refresh);

// Protegida (requiere access_token válido en cookie)
router.get("/profile", guard, authController.profile);

// Logout (borra cookies)
router.post("/logout", authController.logout);

export const authRouter = router;
