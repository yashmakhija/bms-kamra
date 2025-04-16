import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

/**
 * Validates request data against defined validation rules
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

/**
 * Validation rules for login
 */
export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Validation rules for phone login
 */
export const phoneValidation = [
  body("phone")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Valid phone number is required (E.164 format recommended)"),
];

/**
 * Validation rules for OTP verification
 */
export const otpValidation = [
  body("phone")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Valid phone number is required (E.164 format recommended)"),
  body("code")
    .isLength({ min: 6, max: 6 })
    .withMessage("Valid 6-digit OTP code is required"),
];

/**
 * Validation rules for profile update
 */
export const profileUpdateValidation = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("image").optional().isURL().withMessage("Image must be a valid URL"),
];

/**
 * Validation rules for password change
 */
export const passwordChangeValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
];

/**
 * Validation rules for account deletion
 */
export const accountDeletionValidation = [
  body("password")
    .optional()
    .notEmpty()
    .withMessage("Password cannot be empty"),
];
