// src/app.js

const express = require("express");
const mainRouter = require("./routes/index.js");
const cors = require("cors");
const app = express();
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

console.log("Current ENV:", process.env);

const { startScheduler } = require("./utils/cron");

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Myrent API is running!",
    status: "OK",
  });
});

// http://localhost:3000/api/
app.use("/api", mainRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startScheduler();
});
