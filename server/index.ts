import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import util from "util";
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

function extrairMensagemErro(err: unknown): string | undefined {
  if (typeof (err as any)?.message === "string") {
    const mensagem = (err as any).message.trim();
    if (mensagem.length > 0) return mensagem;
  }

  if (typeof err === "string") {
    const mensagem = err.trim();
    if (mensagem.length > 0) return mensagem;
  }

  // Alguns erros do Node (ex: AggregateError de conexao) podem vir sem message no topo.
  const errosAgregados: unknown[] | undefined = (err as any)?.errors;
  if (Array.isArray(errosAgregados) && errosAgregados.length > 0) {
    for (const subErro of errosAgregados) {
      const msg = extrairMensagemErro(subErro);
      if (msg) return msg;
    }
  }

  return undefined;
}

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const status = typeof (err as any)?.statusCode === "number" ? (err as any).statusCode : 500;
  const isProd = process.env.NODE_ENV === "production";
  const mensagemDev = extrairMensagemErro(err) ?? "Internal Server Error";
  const mensagem = status >= 500 && isProd ? "Internal Server Error" : mensagemDev;

  console.error("Error:", mensagemDev);
  console.error(util.inspect(err, { depth: 6, colors: false }));

  res.status(status).json({ error: mensagem });
};
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
