
// const express = require("express");
// const router = express.Router();

// const {
//   question,
//   Allquestion,
//   getSingleQuestion,
// } = require("../controller/questionController");
// router.post("/question", question);
// router.get("/question", Allquestion);
// router.get("/question/:question_id", getSingleQuestion);
// module.exports = router;

// --------------------
const express = require("express");
const router = express.Router();
const {
  question,
  Allquestion,
  getSingleQuestion,
  updateQuestion,
  deleteQuestion
} = require("../controller/questionController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/question", authMiddleware, question);
router.get("/question", Allquestion);
router.get("/question/:question_id", authMiddleware, getSingleQuestion);
router.put("/question/:question_id", authMiddleware, updateQuestion);
router.delete("/question/:question_id", authMiddleware, deleteQuestion);

module.exports = router;

