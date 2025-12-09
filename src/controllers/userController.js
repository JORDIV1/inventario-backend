import { mapDomainErrorToHttp } from "../http/mapDomainErrorToHttp.js";

function whitelistParams(query) {
  return {
    limit: Number(query.limit ?? 10),
    offset: Number(query.offset ?? 0),
    orderBy: String(query.orderBy ?? "created_at").trim(),
    orderDir: String(query.orderDir ?? "DESC")
      .trim()
      .toUpperCase(),
  };
}
function whitelistUsarioPatch(body) {
  return {
    nombre: body.nombre,
    email: body.email,
    rolId: body.rolId,
  };
}
export class UserController {
  /**
   *
   * @param {import("../services/userService.js").UserService} userService
   */
  constructor(userService) {
    this.user = userService;
    this.listPublic = this.listPublic.bind(this);
    this.create = this.create.bind(this);
    this.updatedPartial = this.updatedPartial.bind(this);
    this.remove = this.remove.bind(this);
    this.listAdmin = this.listAdmin.bind(this);
    this.updateAvatarFromR2 = this.updateAvatarFromR2.bind(this);
    this.getAvatar = this.getAvatar.bind(this);
    this.toggleLike = this.toggleLike.bind(this);
  }

  async create(req, res) {
    try {
      const dto = {
        nombre: String(req.body?.nombre ?? ""),
        email: String(req.body?.email ?? ""),
        password: req.body?.password,
        rolId: Number(req.body?.rolId),
      };
      if (!dto.nombre || !dto.email) {
        return res.status(400).json({ ok: false, error: "INVALID_PAYLOAD" });
      }
      if (typeof dto.password !== "string" || dto.password.length === 0) {
        return res.status(400).json({ ok: false, error: "PASSWORD_REQUIRED" });
      }
      const { user } = await this.user.create(dto);

      return res.status(201).json({ ok: true, user });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "INTERNAL_ERROR" });
    }
  }
  async updatedPartial(req, res) {
    try {
      const id = Number(req.params?.id);
      const dto = whitelistUsarioPatch(req.body);
      const out = await this.user.updatedPartial(id, dto);

      if (out === false) {
        return res.status(200).json({ ok: true, changed: false });
      }
      if (out === null) {
        return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      }

      return res.status(200).json({ ok: true, user: out.user });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "UPDATED_ERROR" });
    }
  }

  async remove(req, res) {
    try {
      const id = Number(req.params?.id);
      const result = await this.user.remove(id);
      if (result === false) return res.status(200).json({ ok: true, changed: false });
      if (result === null) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
      return res.status(204).end();
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "DELETE_ERROR" });
    }
  }
  async listPublic(req, res) {
    try {
      const userId = Number(req.user?.id);
      const params = whitelistParams(req.query);
      const { items, meta } = await this.user.listPublic(userId, params);

      return res.status(200).json({ ok: true, items, meta });
    } catch (err) {
     

      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: "USERS_LIST_FAILED" });
    }
  }

  async listAdmin(req, res) {
    try {
      const params = whitelistParams(req.query);
      const { items, meta } = await this.user.listAdmin(params);

      return res.status(200).json({ ok: true, items, meta });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: "USERS_LIST_ADMIN_FAILED" });
    }
  }

  async updateAvatarFromR2(req, res) {
    try {
      const userId = Number(req.user?.id);
      const file = req.file;
      if (!userId) {
        return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
      }
      const { avatarKey } = await this.user.updateAvatar({ userId, file });
      return res.status(200).json({ ok: true, avatarKey: avatarKey });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res
        .status(status)
        .json({ ok: false, error: err?.message ?? "USERS_AVATAR_UPDATE_FAILED" });
    }
  }

  async getAvatar(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ ok: false, error: "INVALID_ID" });
      }
      const result = await this.user.getAvatarByUserId(id);
      if (!result) {
        return res.status(404).end();
      }

      const { stream, contentType, contentLength } = result;
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      if (contentLength) {
        res.setHeader("Content-Length", String(contentLength));
      }
      // Cache + permitir que el frontend en otro dominio pueda usar la imagen
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      stream.pipe(res);
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res
        .status(status)
        .json({ ok: false, error: err?.message ?? "USERS_AVATAR_UNAVAILABLE" });
    }
  }
  async toggleLike(req, res) {
    try {
      const userId = Number(req.user?.id);
      if (!userId) {
        return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
      }
      const targetId = Number(req.body?.objetivoId);
      if (!Number.isInteger(targetId) || targetId <= 0) {
        return res.status(400).json({ ok: false, error: "INVALID_ID" });
      }
      const { liked, likesCount } = await this.user.toggleLike({
        userId: userId,
        targetId: targetId,
      });
      return res.status(200).json({ ok: true, liked, likesCount });
    } catch (err) {
      const status = mapDomainErrorToHttp(err);
      return res.status(status).json({ ok: false, error: err?.message ?? "USER_LIKE_FAILED" });
    }
  }
}
