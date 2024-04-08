// server.js
const express = require("express");
const sql = require("mssql");
const app = express();

app.use(express.json());
app.use(express.static("src"));
app.use(cookieParser()); // Use cookieParses so we'll be able to get the cookie value from req

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

// Import the routes found in the /api folder
const appointmentRoutes = require("./src/api/appointmentRoutes.js");
const clinicRoutes = require("./src/api/clinicRoutes.js");
const doctorRoutes = require("./src/api/doctorRoutes.js");
const pxRoutes = require("./src/api/pxRoutes.js");

app.use(appointmentRoutes);
app.use(clinicRoutes);
app.use(doctorRoutes);
app.use(pxRoutes);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
