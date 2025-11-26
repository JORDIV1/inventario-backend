// backend/src/app.js
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";

import { authRouter } from "./routes/auth.routes.js";
import { productoRouter } from "./routes/producto.routes.js";
import { categoriaRouter } from "./routes/categoria.routes.js";
import { usuarioRouter } from "./routes/user.routes.js";

const app = express();

app.use(helmet());

app.use(express.json());

app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "https://frontend-vercel-iota.vercel.app",
  "https://frontend-inventario-mulb-ggwh1q92x-jordiv1s-projects.vercel.app",
];

const corsOptions = {
  origin(origin, cb) {
    console.log("[CORS] Origin recibido:", origin);

    // Peticiones tipo Postman / curl / healthcheck (sin Origin)
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) {
      console.log("[CORS] Origin PERMITIDO:", origin);
      return cb(null, true);
    }

    console.log("[CORS] Origin NO permitido:", origin);
    // No tiramos error, solo no añadimos headers CORS
    return cb(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use("/auth", authRouter);
app.use("/productos", productoRouter);
app.use("/categorias", categoriaRouter);
app.use("/usuarios", usuarioRouter);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

export default app;
