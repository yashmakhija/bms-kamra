import { Router } from "express";
import {
  register,
  login,
  googleLogin,
  requestPhoneOtp,
  verifyPhoneOtp,
} from "../controllers/authController";
import {
  validate,
  registerValidation,
  loginValidation,
  phoneValidation,
  otpValidation,
} from "../middlewares/validationMiddleware";

const router: Router = Router();

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/google", googleLogin);

router.post("/phone/request-otp", phoneValidation, validate, requestPhoneOtp);
router.post("/phone/verify-otp", otpValidation, validate, verifyPhoneOtp);

export default router;
