import jwt from "jsonwebtoken";

export class JwtService {
  constructor(cfg) {
    if (!cfg.accessSecret || !cfg.refreshSecret) throw new Error("JWT secret requerido");

    this.accessSecret = cfg.accessSecret;
    this.refreshSecret = cfg.refreshSecret;

    this.issuer = cfg.issuer ?? "inventario-app";
    this.audience = cfg.audience ?? "inventario-client";
    this.accessTtl = cfg.accessTtl ?? "15m";
    this.refreshTtl = cfg.refreshTtl ?? "7d";
    this.alg = "HS256";
  }

  #baseOpts(ttl) {
    return { algorithm: this.alg, issuer: this.issuer, audience: this.audience, expiresIn: ttl };
  }

  signAccessToken(user) {
    const payload = { sub: String(user.id), rolId: user.rolId, typ: "access" };
    return jwt.sign(payload, this.accessSecret, this.#baseOpts(this.accessTtl));
  }
  signRefreshToken(user) {
    const payload = { sub: String(user.id), rolId: user.rolId, typ: "refresh" };
    return jwt.sign(payload, this.refreshSecret, this.#baseOpts(this.refreshTtl));
  }

  verifyAccess(token) {
    const p = jwt.verify(token, this.accessSecret, {
      algorithms: [this.alg],
      issuer: this.issuer,
      audience: this.audience,
      clockTolerance: 5,
    });
    if (p.typ !== "access") throw new Error("INVALID_TOKEN_TYPE");
    return p;
  }

  verifyRefresh(token) {
    const p = jwt.verify(token, this.refreshSecret, {
      algorithms: [this.alg],
      issuer: this.issuer,
      audience: this.audience,
      clockTolerance: 5,
    });
    if (p.typ !== "refresh") throw new Error("INVALID_TOKEN_TYPE");
    return p;
  }
  static extractBearer(authHeader) {
    if (!authHeader) return null;
    const [scheme, token] = String(authHeader).trim().split(/\s+/);
    if (scheme?.toLowerCase() !== "bearer" || !token) return null;
    return token;
  }
}
