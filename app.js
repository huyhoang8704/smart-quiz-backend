const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const swaggerDocs = require("./swagger");
const authRoute = require("./routes/authRoute");
const quizRoute = require("./routes/quizRoute");
const materialRoute = require("./routes/materialRoute");

// CORS
app.use(cors());
const port = process.env.PORT || 4000;

// Connect to MongoDB
const connectDB = require("./config/connectMongoDB");
connectDB.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoute);
app.use("/api/quizzes", quizRoute);
app.use("/api/materials", materialRoute);

swaggerDocs(app);
app.get("/healthcheck", (req, res) => {
  res.send("Health check ok");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
