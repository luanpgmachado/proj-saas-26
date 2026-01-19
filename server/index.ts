import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import routes from "./routes";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
};
app.use(errorHandler);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
