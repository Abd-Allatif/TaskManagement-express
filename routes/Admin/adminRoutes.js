const express = require("express");
const {
  register,
  verifyEmail,
  login,
  logout,
} = require("../../controllers/Admin/adminController");
const {
  adminRegisterRules,
  adminLoginRules,
  validate,
} = require("../../middleware/validators/adminValidators");

const router = express.Router();

router.post("/register", adminRegisterRules, validate, register);
router.post("/verify-email", verifyEmail);
router.post("/login", adminLoginRules, validate, login);
router.post("/logout", logout);

module.exports = router;
