const express = require('express');
const cors = require('cors');
const router = require("./routes/router")
const { configDotenv } = require('dotenv');
configDotenv();
require("./db-connection")

const app = express();
const port = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());
app.use(router);

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
