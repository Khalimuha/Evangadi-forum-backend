// updated
const express = require("express");
const router = express.Router();
const { register, checkuser, login } = require("../Controller/userController");
const authMiddleware = require("../middleware/authMiddleware");
router.post("/register", register);

router.post("/login", login);
router.get("/check", authMiddleware, checkuser);

module.exports = router;
