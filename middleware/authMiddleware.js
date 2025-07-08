const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Authentication invaild" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const { username, userid } = jwt.verify(token, process.env.JWTSECRET);  //.....
    // return res.status(StatusCodes.OK).json(data)
    req.user = { username, userid };
    next();  //   what is next?
  } catch (error) {
    console.log(error.message);
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Authentication invaild" });
  }
}
module.exports = authMiddleware;
