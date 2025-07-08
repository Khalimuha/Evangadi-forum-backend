const mysql2 = require("mysql2");
const express = require("express");
const cors = require("cors");

const app = express();

const passwordRoutes = require("./Routes/passwordRoutes");
app.use(passwordRoutes);

const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for frontend (development only)
app.use(express.json()); // Single JSON body parser (remove body-parser)
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (if needed)

// Routes
const installRoutes = require("./Routes/installRoute");
app.use("/", installRoutes);

const userRoutes = require("./Routes/userRoute");
app.use("/api/users", userRoutes);

const questionRoutes = require("./Routes/questionRoute"); //import question routes
const answerRoutes = require("./Routes/answerRoute"); //import answer routes
const authMiddleware = require("./middleware/authMiddleware"); //import middleware

app.use("/api", authMiddleware, questionRoutes);
app.use("/api", authMiddleware, answerRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Welcome");
});


// Database connection
const dbConnection = require("./db/dbconfig");

async function start() {
  try {
    const connection = await dbConnection.getConnection();

    connection.release(); // Release the connection back to the pool
  } catch (error) {
    console.error(
      "Database connection failed at",
      new Date().toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" }),
      ":",
      error.message
    );
    process.exit(1); // Exit if connection fails to prevent server start
  }
}

// Start server after database connection
start()
  .then(() => {
    app.listen(port, (error) => {
      if (error) {
        console.error(
          "Server start failed at",
          new Date().toLocaleString("en-US", {
            timeZone: "Africa/Addis_Ababa"
          }),
          ":",
          error.message
        );
      } else {
        console.log(
          "Server listening on port",
          port,
          "at",
          new Date().toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" })
        );
      }
    });
  })
  .catch((error) => {
    console.error(
      "Start function error at",
      new Date().toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" }),
      ":",
      error.message
    );
    process.exit(1);
  });

// Global error handler
app.use((err, req, res, next) => {
  console.error(
    "Global error handler at",
    new Date().toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" }),
    ":",
    err
  );
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "An unexpected error occurred.",
    error: err.message
  });
});
