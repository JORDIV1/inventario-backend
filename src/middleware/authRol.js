export function requireRole(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new Error("requireRole requiere al menos un rol permitido");
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    }

    const rolId = Number(req.user?.rolId);

    if (!Number.isInteger(rolId)) {
      return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
    }

    if (!allowedRoles.includes(rolId)) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }
    return next();
  };
}

