const express = require("express");
const {
  register,
  verifyEmail,
  login,
  logout,
} = require("../controllers/authContoller");

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/logout", logout);

module.exports = router;