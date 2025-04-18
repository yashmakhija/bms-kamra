import { Router, Request, Response } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import adminRoutes from "./adminRoutes";

const router: Router = Router();

router.use("/auth", authRoutes);

router.use("/users", userRoutes);

router.use("/admin", adminRoutes);

router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

export default router;
