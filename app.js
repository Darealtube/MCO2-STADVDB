// server.js
const express = require("express");
const mysql = require("mysql2/promise");
const app = express();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: "mco2.cpsqomyoe0wj.ap-southeast-2.rds.amazonaws.com", // Replace with your MySQL host address
  port: "3306",
  user: "admin", // Replace with your MySQL username
  password: "STADVDB13", // Replace with your MySQL password
  database: "mco1", // Replace with your database name
});

pool
  .query("SELECT * FROM appointments")
  .then((results) => {
    console.log("Connection successful and query executed!");
  })
  .catch((err) => {
    console.error("Error connecting or executing query:", err);
  });

app.use(express.json());
app.use(express.static("src"));

// Import the routes found in the /api folder
const appointmentRoutes = require("./src/api/appointmentRoutes.js");

app.use(appointmentRoutes);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
