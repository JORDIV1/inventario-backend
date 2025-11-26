import { jwtService } from "./index.js";
import { authGuard } from "../middleware/authGuard.js";
//se crea el middleware real pasasndo la instancia configurada
export const guard = authGuard(jwtService);
export const ROLES = { ADMIN: 1, USER: 2 };
