/**
 * @param {import("../security/jwtService.js").JwtService} jwtService
 */
export function authGuard(jwtService) {
  if (!jwtService.verifyAccess) {
    throw new Error("authGuard requiere un jwtService");
  }

  return (req, res, next) => {
    //cookies httpOnly
    let token = req?.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    }
    try {
      //verifica  firma, exp, iss, aud, typ
      const p = jwtService.verifyAccess(token);
      // Exponer identidad para el controller / requireRole
      req.user = { id: Number(p.sub), rolId: p.rolId };
      return next(); // pasa el mismo req al siguiente paso
    } catch {
      return res.status(401).json({ ok: false, error: "INVALID_TOKEN" });
    }
  };
}
