
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";

import { authRouter } from "./routes/auth.routes.js";
import { productoRouter } from "./routes/producto.routes.js";
import { categoriaRouter } from "./routes/categoria.routes.js";
import { usuarioRouter } from "./routes/user.routes.js";
import { movimientoRouter } from "./routes/movimiento.routes.js";

const app = express();

app.use(helmet());

app.use(express.json());

app.use(cookieParser());
const ALLOWED_ORIGINS = [
  "https://www.gestioncom.org",
  "https://gestioncom.org",
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error("CORS_ORIGIN_NOT_ALLOWED"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/auth", authRouter);
app.use("/productos", productoRouter);
app.use("/movimientos", movimientoRouter);
app.use("/categorias", categoriaRouter);
app.use("/usuarios", usuarioRouter);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

export default app;
