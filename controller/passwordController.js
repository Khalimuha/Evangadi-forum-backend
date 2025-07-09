const jwt = require("jsonwebtoken");
const db = require("../db/dbConfig");
const { StatusCodes } = require("http-status-codes");

// POST /users/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email
    ]);
    if (rows.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Email not found" });
    }

    const user = rows[0];
    const token = jwt.sign({ userid: user.userid }, process.env.JWT_SECRET, {
      expiresIn: "15m"
    });

    // For simplicity: log the token instead of sending email
    console.log(`Reset link: http://localhost:3000/reset-password/${token}`);

    res
      .status(StatusCodes.OK)
      .json({ message: "Password reset link sent (check console)." });
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error" });
  }
};

// POST /users/reset-password/:token
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = newPassword; // Add bcrypt.hash here in real project

    await db.execute("UPDATE users SET password = ? WHERE userid = ?", [
      hashedPassword,
      decoded.userid
    ]);

    res.status(StatusCodes.OK).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid or expired token" });
  }
};
