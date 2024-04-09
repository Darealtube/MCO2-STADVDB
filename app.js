// server.js
const express = require("express");
const mysql = require("mysql2/promise");
const app = express();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: '10.2.0.39', // Replace with your MySQL host address
  port: "20039",
  user: "stadvdb", // Replace with your MySQL username
  password: "|STadvdb|13", // Replace with your MySQL password
  database: "appointments", // Replace with your database name
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
