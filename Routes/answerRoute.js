// 
const express = require("express");
const router=express.Router()
const authMiddleware = require("../middleware/authMiddleware")

const {
  postAnswer,
  getAnswer,
  updateAnswer,
  deleteAnswer
} = require("../controller/answerController");

router.post("/answer/:questionid", postAnswer);
router.get("/answer/:questionid", getAnswer);
router.put("/answer/:answerid", authMiddleware, updateAnswer);
router.delete("/answer/:answerid", authMiddleware, deleteAnswer);



module.exports=router
