import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isDev = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT ? parseInt(process.env.PORT) : (isDev ? 3001 : 5000);
const HOST = "0.0.0.0";

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res, next) => {
  // Evita requests "pendurados" quando alguem chama /api ou /api/ sem rota.
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = typeof (err as any)?.statusCode === "number" ? (err as any).statusCode : 500;
  console.error("Error:", err.message);
  res.status(status).json({ error: err.message || "Internal Server Error" });
};
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
