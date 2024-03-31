// server.js
const express = require("express");
const sql = require("mssql");
const app = express();

// Configure SQL Server connection
const config = {
  user: "your_username",
  password: "your_password",
  server: "your_server",
  database: "your_database",
};

// Connect to SQL Server
sql
  .connect(config)
  .then((pool) => {
    console.log("Connected to SQL Server");
  })
  .catch((err) => {
    console.error("SQL Connection Error", err);
  });

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
