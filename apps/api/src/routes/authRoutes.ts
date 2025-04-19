import { Router } from "express";
import {
  register,
  login,
  googleLogin,
  requestPhoneOtp,
  verifyPhoneOtp,
  verifyAuth,
} from "../controllers/authController";
import {
  validate,
  registerValidation,
  loginValidation,
  phoneValidation,
  otpValidation,
} from "../middlewares/validationMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router: Router = Router();

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/google", googleLogin);

router.post("/phone/request-otp", phoneValidation, validate, requestPhoneOtp);
router.post("/phone/verify-otp", otpValidation, validate, verifyPhoneOtp);

router.get("/verify", authMiddleware, verifyAuth);

export default router;
