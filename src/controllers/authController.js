import { mapDomainErrorToHttp } from "../http/mapDomainErrorToHttp.js";

const COOKIE_ACCESS = "access_token";
const COOKIE_REFRESH = "refresh_token";

//normalizar- satanizar el input http antes de pasar al service
function whitelistRegister(body) {
  return {
    nombre: String(body?.nombre ?? "").trim(),
    email: String(body?.email ?? "")
      .trim()
      .toLowerCase(),
    password: body?.password, // argon2
  };
}

function whitelistLogin(body) {
  return {
    email: String(body?.email ?? "")
      .trim()
      .toLowerCase(),
    password: body?.password,
  };
}

export class AuthController {
  /**@param {import("../services/authService.js").AuthService} authService */
  constructor(authService) {
    this.auth = authService;
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.refresh = this.refresh.bind(this);
    this.profile = this.profile.bind(this);
    this.logout = this.logout.bind(this);
  }

  #cookieOpts(scope = "access") {
    const isprod = process.env.NODE_ENV === "production"; // si esto da true - secure usa true
    const secure =
      String(process.env.COOKIE_SECURE ?? (isprod ? "true" : "false")).toLowerCase() === "true";
    const sameSite = (process.env.COOKIE_SAMESITE ?? (secure ? "none" : "lax")).toLowerCase(); //samesite usa none si secure es true- cors-site

    const base = { httpOnly: true, secure, sameSite };
    if (scope === "access") {
      return { ...base, path: "/", maxAge: 15 * 60 * 1000 }; //15 min
    }
    if (scope === "refresh") {
      return { ...base, path: "/auth/refresh", maxAge: 7 * 24 * 60 * 60 * 1000 }; //7 dias
    }
    return base;
  }

  #setAccessCookie(res, accessToken) {
    res.cookie(COOKIE_ACCESS, accessToken, this.#cookieOpts("access"));
  }
  #setRefreshCookie(res, refreshToken) {
    res.cookie(COOKIE_REFRESH, refreshToken, this.#cookieOpts("refresh"));
  }
  #clearTokens(res) {
    const acc = this.#cookieOpts("access");
    const ref = this.#cookieOpts("refresh");
    res.clearCookie(COOKIE_ACCESS, { path: acc.path, sameSite: acc.sameSite, secure: acc.secure });
    res.clearCookie(COOKIE_REFRESH, { path: ref.path, sameSite: ref.sameSite, secure: ref.secure });
  }

  async register(req, res) {
    try {
      const dto = whitelistRegister(req.body);
      if (!dto.nombre || !dto.email) {
        return res.status(400).json({ ok: false, error: "INVALID_PAYLOAD" });
      }
      if (typeof dto.password !== "string" || dto.password.length === 0) {
        return res.status(400).json({ ok: false, error: "PASSWORD_REQUIRED" });
      }

      const { user, tokens } = await this.auth.register(dto);
      this.#setAccessCookie(res, tokens.accessToken);
      this.#setRefreshCookie(res, tokens.refreshToken);
      return res.status(201).json({ ok: true, user });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }

  async login(req, res) {
    try {
      const dto = whitelistLogin(req.body);
      if (!dto.email) {
        return res.status(400).json({ ok: false, error: "EMAIL_REQUIRED" });
      }
      if (typeof dto.password !== "string" || dto.password.length === 0) {
        return res.status(400).json({ ok: false, error: "PASSWORD_REQUIRED" });
      }
      const { user, tokens } = await this.auth.login(dto);
      this.#setAccessCookie(res, tokens.accessToken);
      this.#setRefreshCookie(res, tokens.refreshToken);
      return res.status(200).json({ ok: true, user });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }

  async refresh(req, res) {
    try {
      const rt = req.cookies?.[COOKIE_REFRESH]; 
      if (!rt) return res.status(401).json({ ok: false, error: "REFRESH_MISSING" });
     
      //funciona con rotacion y sin rotacion de token 
      const { accessToken } = await this.auth.refresh({ refreshToken: rt });

      this.#setAccessCookie(res, accessToken);
      //COOKIE_REFRESH - expira en 7 dias desde el login
      return res.status(200).json({ ok: true, message: "token refreshed" });
    } catch (err) {
      //si fallo (RT ivalido/expirado), borra ambas para obligar a reloguear
      this.#clearTokens(res);
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }

  async profile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
      }

      const out = await this.auth.getProfileById(req.user.id);

      if (!out) {
        return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      }

      return res.status(200).json({ ok: true, user: out.user });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: "AUTH_REPO_UNAVAILABLE" });
    }
  }

  async logout(req, res) {
    this.#clearTokens(res);
    return res.status(204).end();
  }
}
