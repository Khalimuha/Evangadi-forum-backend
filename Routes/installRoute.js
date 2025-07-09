// updated
const express = require("express");
const router = express.Router();

const { install } = require("../controller/installController");
router.get("/install", install);

module.exports = router;
