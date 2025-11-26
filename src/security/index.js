import { JwtService } from "./jwtService.js";
export const jwtService = new JwtService({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
  accessTtl: process.env.ACCESS_TOKEN_TTL,
  refreshTtl: process.env.REFRESH_TOKEN_TTL,
});
