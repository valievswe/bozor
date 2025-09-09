// src/app.js

const express = require("express");
const mainRouter = require("./routes/index.js"); // Barcha route'larni boshqaradigan asosiy router
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const { startScheduler } = require("./utils/cron");

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Bozor API is running!",
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
