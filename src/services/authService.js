import argon2 from "argon2";

import { Usuario } from "../models/user.js";
const EMAIL_REGEX = /^[^\s,@]+@[^\s,@]+(\.[^\s,@]+)+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{10,}$/;
export class AuthService {
  /**
   *
   * @param {import("../repositories/usuarioRepo.js").UsuarioRepository} repo
   * @param {import("../security/jwtService.js").JwtService} jwtService
   */
  constructor(repo, jwtService) {
    this.repo = repo;
    this.jwt = jwtService;
  }
  async getProfileById(id) {
    if (!Number.isInteger(id) || id <= 0) return null;

    let row;
    try {
      row = await this.repo.findById(id);
    } catch {
      throw new Error("AUTH_REPO_UNAVAILABLE");
    }

    if (!row) return null;

    const usuario = Usuario.fromRow(row);
    return { user: usuario.toPublicDTO() }; // mismo formato que login
  }

  async register(dto) {
    const email = String(dto.email ?? "")
      .trim()
      .toLowerCase();
    // Pre-check: evita consultas redundantes en la mayoría de casos
    const rowExistente = await this.repo.findByEmail(email);
    if (rowExistente) {
      //OJOOOOOOOOOOOOOOOO
      throw new Error("EMAIL_TAKEN");
    }
    if (!EMAIL_REGEX.test(email) || email.length > 30) {
      throw new TypeError("EMAIL_INVALID");
    }
    const base = Usuario.fromRegisterJSON({
      nombre: String(dto.nombre).trim(),
      email: String(dto.email).toLowerCase().trim(),
      //ROL_ID VIene por default en la entidad
    });

    const raw = String(dto.password);
    if (raw.length < 10) throw new RangeError("PASSWORD_TOO_SHORT");
    //al menos 1 mayúscula y 1 dígito
    if (!PASSWORD_REGEX.test(raw)) throw new RangeError("PASSWORD_WEAK");

    const hash = await argon2.hash(raw, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    const conHash = base.withPasswordHash(hash);

    // Defensa final: captura duplicado si ocurre entre el pre-check y el insert
    let insertId;
    try {
      insertId = await this.repo.insert(conHash.toInsertRow());
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") throw new Error("EMAIL_TAKEN");
      throw new Error("INTERNAL_ERROR");
    }

    const rowFinal = await this.repo.findById(insertId);
    if (!rowFinal) throw new Error("REGISTER_READ_BACK_FAILED");
    //reconstruyo la entidad
    const usuarioFinal = Usuario.fromRow(rowFinal);
    //aplico tokens
    const accessToken = this.jwt.signAccessToken(usuarioFinal);
    const refreshToken = this.jwt.signRefreshToken(usuarioFinal);

    return {
      user: usuarioFinal.toPublicDTO(),
      tokens: { accessToken, refreshToken },
    };
  }

  async login(dto) {
    const email = String(dto.email ?? "")
      .toLowerCase()
      .trim();

    if (typeof dto?.password !== "string" || dto.password.length === 0)
      throw new TypeError("PASSWORD_REQUIRED");
    const password = dto.password;
    if (email.length === 0) throw new TypeError("EMAIL_REQUIRED");

    //Es un código de dominio, Convención profesional para códigos de error estables y legibles.
    let row;
    try {
      row = await this.repo.findByEmail(email);
    } catch {
      //aisla detalles sql del controller el controller no ve detalles SQL
      throw new Error("AUTH_REPO_UNAVAILABLE");
    }

    //retardos minimo

    const MAX_DELAY_MS = 300;
    const start = Date.now();

    //Bandera o puente lógico que indica si la verificación emial - (argon2.verify) fue exitosa o no.
    let ok = false;

    if (row?.password_hash) {
      try {
        //argon2id Variante moderna,
        ok = await argon2.verify(row.password_hash, password);
      } catch {
        ok = false;
      }
    }

    const elapsed = Date.now() - start;
    //una técnica para difuminar patrones de tiempo., suposicion de ataques
    const jitter = Math.floor(Math.random() * 41) - 20;
    const remaining = Math.max(0, MAX_DELAY_MS - elapsed + jitter);

    if (!ok) {
      if (remaining > 0) {
        //la función queda pausada
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      throw new Error("INVALID_CREDENTIALS");
    }

    const usuarioFinal = Usuario.fromRow(row);
    const accessToken = this.jwt.signAccessToken(usuarioFinal); //usa accessSecret + opts (alg, iss, aud, exp)
    const refreshToken = this.jwt.signRefreshToken(usuarioFinal);

    return {
      user: usuarioFinal.toPublicDTO(),
      tokens: { accessToken, refreshToken },
    };
  }
  //refresh
  async refresh({ refreshToken }) {
    let p;
    try {
      p = this.jwt.verifyRefresh(refreshToken);
    } catch {
      throw new Error("REFRESH_INVALID");
    }
    const user = { id: Number(p.sub), rolId: p.rolId };
    const accessToken = this.jwt.signAccessToken(user);

    return { accessToken };
  }
}
