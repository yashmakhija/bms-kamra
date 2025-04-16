import { Router, Request, Response } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";

const router: Router = Router();

router.use("/auth", authRoutes);

router.use("/users", userRoutes);

router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

export default router;
