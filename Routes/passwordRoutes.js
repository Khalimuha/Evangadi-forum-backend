const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  resetPassword
} = require("../controller/passwordController");

router.post("/users/forgot-password", forgotPassword);
router.post("/users/reset-password/:token", resetPassword);

module.exports = router;
