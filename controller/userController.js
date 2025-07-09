const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const dbConnection = require("../db/dbConfig");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// user register
async function register(req, res) {
  // check if the user provides all the information required
  const { username, first_name, last_name, email, password } = req.body;
  if (!username || !first_name || !last_name || !email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please provide all required fields"
    });
  }
  // response if the input password less than 8 digit
  if (password.length < 8) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Password must be at least 8 characters"
    });
  }
  try {
    // check if the user already exists
    const [user] = await dbConnection.query(
      "SELECT username,userid FROM users WHERE username = ? or email = ?",
      [username, email]
    );
    // response if the user exists
    if (user.length > 0) {
      return res.status(StatusCodes.CONFLICT).json({
        message: "User already existed"
      });
    }

    // encrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // insert the user to database
    await dbConnection.query(
      "INSERT INTO users (username, firstname, lastname, email, password) VALUES (?,?,?,?,?)",
      [username, first_name, last_name, email, hashedPassword]
    );
    return res
      .status(StatusCodes.CREATED)
      .json({ msg: "User registered successfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An unexpected error occurred."
    });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "please provide all required information" });
  }

  try {
    // Check if the user exists based on the email
    const [user] = await dbConnection.query(
      "select username,userid,password from users where email=? ",
      [email]
    );

    // If the user does not exist, return an error
    if (user.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "invalid credential" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user[0].password);

    if (!isMatch) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "invalid credential" });
    }

    // If username and password are correct, generate a JWT token
    const username = user[0].username;
    const userid = user[0].userid;
    const token = jwt.sign({ username, userid }, process.env.JWTSECRET, {
      expiresIn: "1d"
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: "user login successfully", token });
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "something went wrong, try again later" });
  }
}
function checkuser(req, res) {
  const username = req.user.username;
  const userid = req.user.userid;
  return res
    .status(StatusCodes.OK)
    .json({ message: "valid user", username, userid });
}

module.exports = { register, checkuser, login };
