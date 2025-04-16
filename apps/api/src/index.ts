import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import router from "./routes";

const app: express.Application = express();
const port = config.server.port;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api", router);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "BMS API Server" });
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(
    `API server running on port ${port} in ${config.server.nodeEnv} mode`
  );
});

export default app;
