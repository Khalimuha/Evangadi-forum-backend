// 
const {
  StatusCodes,
  BAD_REQUEST,
  NOT_FOUND,
  OK,
} = require("http-status-codes");
const dbConnection = require("../db/dbconfig");
const { json, query } = require("express");

async function postAnswer(req, res) {
  //
  const { answer } = req.body;
  const { questionid } = req.params;
  console.log(questionid);
  if (!questionid || !answer) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "please provide all requird information" });
  }
  try {
    const username = req.user.username; // from auth middlewear
    const userid = req.user.userid; // from auth middlewear
    await dbConnection.query(
      "insert into answers (questionid,userid,answer) values(?,?,?)",
      [questionid, userid, answer]
    );
    return res.status(StatusCodes.CREATED).json({ msg: "answer added" });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "someting went wrong,try again later" });
  }
}

// async function getAnswer(req, res) {
//   // req.params: Used to get data from the URL path of the request, typically in GET requests.
//   const { questionid } = req.params;

//   // Check if question_id is provided
//   if (!questionid) {
//     return res
//       .status(StatusCodes.BAD_REQUEST)
//       .json({ msg: "Please provide a question ID." });
//   }
//   try {
//     // First, check if the question exists
//     const [questions] = await dbConnection.query(
//       "SELECT questionid FROM questions WHERE questionid = ?",
//       [questionid]
//     );
//     // If the question does not exist, return an error
//     if (questions.length === 0) {
//       return res
//         .status(StatusCodes.NOT_FOUND)
//         .json({ message: "No question found with this ID." });
//     }
//     const userid = req.user.userid; // from auth middlewear
//     // retrieve/get answers for a specific question
//     const [answer] = await dbConnection.query(
//       "SELECT answers.answerid, answers.answer, answers.userid, answers.created_at,users.username AS user_name FROM answers JOIN users ON answers.userid = users.userid WHERE questionid = ?",
//       [questionid]
//     );
//     return res.status(StatusCodes.OK).json({ questionid, answer: answer });
//   } catch (error) {
    
//     console.log(error.message);
//     return res
//       .status(StatusCodes.INTERNAL_SERVER_ERROR)
//       .json({ msg: "something went wrong, please try again!" });
//   }
// }
//---------------------------------
async function getAnswer(req, res) {
  const { questionid } = req.params;

  // Pagination parameters: ?page=1&limit=5
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4; // Default: 4 answers per page
  const offset = (page - 1) * limit;

  if (!questionid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide a question ID." });
  }

  try {
    // Check if the question exists
    const [questions] = await dbConnection.query(
      "SELECT questionid FROM questions WHERE questionid = ?",
      [questionid]
    );

    if (questions.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "No question found with this ID." });
    }

    // Total count for pagination
    const [countResult] = await dbConnection.query(
      "SELECT COUNT(*) AS total FROM answers WHERE questionid = ?",
      [questionid]
    );
    const total = countResult[0].total;

    // Paginated answer results
    const [answer] = await dbConnection.query(
      `SELECT answers.answerid, answers.answer, answers.userid, answers.created_at,
              users.username AS user_name
       FROM answers
       JOIN users ON answers.userid = users.userid
       WHERE answers.questionid = ?
       ORDER BY answers.created_at DESC
       LIMIT ? OFFSET ?`,
      [questionid, limit, offset]
    );

    return res.status(StatusCodes.OK).json({
      questionid,
      totalAnswers: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      answer: answer
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong, please try again!" });
  }
}

async function updateAnswer(req, res) {
  const { answerid } = req.params;
  const { answer } = req.body;

  if (!answerid || !answer) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide answer ID and updated answer text." });
  }

  try {
    const userid = req.user.userid;

    // Check ownership
    const [existing] = await dbConnection.query(
      "SELECT * FROM answers WHERE answerid = ? AND userid = ?",
      [answerid, userid]
    );

    if (existing.length === 0) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: "You are not authorized to update this answer."
      });
    }
    console.log("answerid from param:", answerid);
    console.log("answer from body:", answer);
    console.log("user from token:", req.user); // check req.user is defined

    
    await dbConnection.query(
      "UPDATE answers SET answer = ? WHERE answerid = ?",
      [answer, answerid]
    );
    

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Answer updated successfully." });
  } catch (error) {
    console.log(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Something went wrong. Please try again."
    });
  }
}

async function deleteAnswer(req, res) {
  const { answerid } = req.params;

  if (!answerid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide answer ID." });
  }

  try {
    const userid = req.user.userid;

    // Check ownership
    const [existing] = await dbConnection.query(
      "SELECT * FROM answers WHERE answerid = ? AND userid = ?",
      [answerid, userid]
    );

    if (existing.length === 0) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: "You are not authorized to delete this answer."
      });
    }

    await dbConnection.query("DELETE FROM answers WHERE answerid = ?", [
      answerid
    ]);

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Answer deleted successfully." });
  } catch (error) {
    console.log(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Something went wrong. Please try again."
    });
  }
}


module.exports = {
  postAnswer,
  getAnswer,
  updateAnswer,
  deleteAnswer
};

