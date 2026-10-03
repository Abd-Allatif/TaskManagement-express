const express = require("express");
const {
  register,
  verifyEmail,
  login,
  logout,
} = require("../controllers/authContoller.js");
const { registerRules,loginRules, validate } = require("../middleware/validators/authValidators.js");

const router = express.Router();

router.post("/register",registerRules, validate ,register);
router.post("/verify-email", verifyEmail);
router.post("/login",loginRules, validate, login);
router.post("/logout", logout);

module.exports = router;