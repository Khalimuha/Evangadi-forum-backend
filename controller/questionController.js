// Import the database connection config
const dbConnection = require("../db/dbconfig");

const { StatusCodes } = require("http-status-codes");

const { v4: uuidv4 } = require("uuid");

// Define an async function to handle asking a question
async function question(req, res) {
  const { title, description } = req.body; // Destructure title and description from the request body

  // Generate a unique question ID using UUID
  const questionid = uuidv4();

  // Check if required fields are missing
  if (!title || !description) {
    return res
      .status(StatusCodes.BAD_REQUEST) // 400
      .json({ msg: "Please provide all required information" });
  }

  // Validate title length (max 50 characters)
  if (title.length > 50) {
    return res
      .status(StatusCodes.BAD_REQUEST) // 400
      .json({ msg: "Title must be less than 50 characters" });
  }

  // Validate description length (max 200 characters)
  if (description.length > 200) {
    return res
      .status(StatusCodes.BAD_REQUEST) // 400
      .json({ msg: "Description must be less than 200 characters" });
  }

  try {
    // Extract username and userid from authenticated user (set by auth middleware)
    const username = req.user.username;
    const userid = req.user.userid;

    // Check if the user already asked the same question
    const [existingQuestion] = await dbConnection.query(
      "SELECT * FROM questions WHERE title = ? AND description = ? AND userid = ?",
      [title, description, userid]
    );

    // If found, return a 409 Conflict response
    if (existingQuestion.length > 0) {
      return res
        .status(StatusCodes.CONFLICT) // 409
        .json({ msg: "You already asked this question." });
    }

    // Insert the new question into the database
    await dbConnection.query(
      "INSERT INTO questions (questionid, userid, title, description) VALUES (?, ?, ?, ?)", // (?, ?, ?, ?) are placeholders for the values to be inserted
      [questionid, userid, title, description] // is an array of values that will replace each ? in order.
    );

    // Respond with success message and the new question ID
    return res
      .status(StatusCodes.CREATED) // 201
      .json({ msg: "Question added", questionid });
  } catch (error) {
    // Log error to console for debugging
    console.error("Error adding question:", error);

    // Send generic internal server error response
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR) // 500
      .json({ msg: "Something went wrong, try again later" });
  }
}
//------------------------------------
async function Allquestion(req, res) {
  const { page = 1, limit = 4 } = req.query; // Get page & limit from query params, default to 1 & 5
  const offset = (page - 1) * limit; // Calculate offset for pagination

  try {
    // Get total number of questions for pagination info
    const [totalResult] = await dbConnection.query(
      "SELECT COUNT(*) AS count FROM questions"
    );
    const totalQuestions = totalResult[0].count;
    const totalPages = Math.ceil(totalQuestions / limit);

    // Fetch paginated questions with user info
    const [results] = await dbConnection.query(
      `SELECT 
        questions.questionid AS question_id,
        questions.userid,
        questions.title,
        questions.description AS content,
        users.username AS user_name
      FROM questions
      JOIN users ON questions.userid = users.userid
      ORDER BY questions.id DESC
      LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    return res.status(StatusCodes.OK).json({
      questions: results,
      totalQuestions,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error("Error fetching paginated questions:", error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Failed to fetch questions. Please try again later."
    });
  }
}

// Function to get a single question based on its ID
async function getSingleQuestion(req, res) {
  // Get the question_id from the route parameters
  const { question_id } = req.params;

  // Check if the ID was provided
  if (!question_id) {
    return res
      .status(StatusCodes.BAD_REQUEST) // 400
      .json({ msg: "Please provide a question ID." });
  }

  try {
    // Query the database for the question with the given ID
    const [question] = await dbConnection.query(
      "SELECT questionid, title, description, created_at, userid FROM questions WHERE questionid = ?",
      [question_id]
    );

    // If no matching question is found, return 404
    if (question.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND) // 404
        .json({ message: "No question found with this ID." });
    }

    // Return the found question
    return res.status(StatusCodes.OK).json({ question: question[0] });
  } catch (error) {
    // Log any error
    console.error("Error while retrieving question:", error.message);

    // Return server error if something went wrong
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR) // 500
      .json({ msg: "Something went wrong, please try again!" });
  }
}

//update question
async function updateQuestion(req, res) {
  const { question_id } = req.params;
  const { title, description } = req.body;
  const userid = req.user.userid;

  if (!title || !description) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide both title and description" });
  }

  try {
    // Check if question exists and belongs to the user
    const [existing] = await dbConnection.query(
      "SELECT * FROM questions WHERE questionid = ? AND userid = ?",
      [question_id, userid]
    );

    if (existing.length === 0) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "You are not authorized to update this question" });
    }

    // Update question
    await dbConnection.query(
      "UPDATE questions SET title = ?, description = ? WHERE questionid = ?",
      [title, description, question_id]
    );

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Question updated successfully" });
  } catch (error) {
    console.error("Error updating question:", error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong, please try again" });
  }
}

//delete question---------------
async function deleteQuestion(req, res) {
  const { question_id } = req.params;
  const userid = req.user.userid;

  if (!question_id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide a question ID" });
  }

  try {
    // Check ownership
    const [question] = await dbConnection.query(
      "SELECT * FROM questions WHERE questionid = ? AND userid = ?",
      [question_id, userid]
    );

    if (question.length === 0) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ msg: "You are not authorized to delete this question" });
    }

    // Optionally, delete associated answers first
    await dbConnection.query("DELETE FROM answers WHERE questionid = ?", [
      question_id
    ]);

    // Then delete the question
    await dbConnection.query("DELETE FROM questions WHERE questionid = ?", [
      question_id
    ]);

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong, please try again" });
  }
}

// Export the functions so they can be used in route files
module.exports = {
  question,
  Allquestion,
  getSingleQuestion,
  updateQuestion,
  deleteQuestion
};
