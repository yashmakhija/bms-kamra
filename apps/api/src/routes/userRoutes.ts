import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  validate,
  profileUpdateValidation,
  passwordChangeValidation,
  accountDeletionValidation,
} from "../middlewares/validationMiddleware";

const router: Router = Router();

router.use(authMiddleware);

router.get("/me", getProfile);

router.put("/profile", profileUpdateValidation, validate, updateProfile);

router.post(
  "/change-password",
  passwordChangeValidation,
  validate,
  changePassword
);

router.delete("/account", accountDeletionValidation, validate, deleteAccount);

export default router;
