// server.js
const express = require("express");
const mysql = require("mysql2/promise");
const app = express();

const changeLog = [];

// Replace with your RDS configuration details
const phPool = mysql.createPool({
  connectionLimit: 10,
  host: "ccscloud.dlsu.edu.ph", // Replace with your MySQL host address
  port: "20039",
  user: "root", // Replace with your MySQL username
  password: "|STadvdb|13", // Replace with your MySQL password
  database: "mco1", // Replace with your database name
  queueLimit: 0,
  waitForConnections: true,
});

const luzonPool = mysql.createPool({
  connectionLimit: 10,
  host: "ccscloud.dlsu.edu.ph", // Replace with your MySQL host address
  port: "20040",
  user: "root", // Replace with your MySQL username
  password: "|STadvdb|13", // Replace with your MySQL password
  database: "mco1", // Replace with your database name
  queueLimit: 0,
  waitForConnections: true,
});

const visminPool = mysql.createPool({
  connectionLimit: 10,
  host: "ccscloud.dlsu.edu.ph", // Replace with your MySQL host address
  port: "20041",
  user: "root", // Replace with your MySQL username
  password: "|STadvdb|13", // Replace with your MySQL password
  database: "mco1", // Replace with your database name
  queueLimit: 0,
  waitForConnections: true,
});

app.use(express.json());
app.use(express.static("src"));

app.get("/appointments", async (req, res) => {
  try {
    const sql = "SELECT * FROM appointments ORDER BY EndTime DESC LIMIT 20;";
    const result = await phPool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// viewing a specific appointment
app.get("/appointments/:id", async (req, res) => {
  const appointmentId = req.params.id;
  try {
    const sql = "SELECT * FROM appointments WHERE apptid = ?";
    const [results] = await phPool.query(sql, [appointmentId]);
    if (results.length > 0) {
      const appointment = results[0];
      res.status(200).json(appointment);
    } else {
      res.status(404).send("Appointment not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// edit appointment
app.put("/appointments/:id", async (req, res) => {
  const appointmentId = req.params.id;
  const appointmentData = req.body;
  try {
    const sql = "UPDATE appointments SET ? WHERE apptid = ?";
    const [result] = await phPool.query(sql, [appointmentData, appointmentId]);

    if (result.affectedRows > 0) {
      res.status(200).send("Appointment updated successfully!");
    } else {
      res
        .status(404)
        .send("Error occurred while trying to update the appointment");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// creating appointment
app.post("/appointments", async function (req, res) {
  const {
    apptid,
    pxid,
    doctorid,
    clinicid,
    status,
    TimeQueued,
    QueueDate,
    StartTime,
    EndTime,
    type,
    isVirtual,
  } = req.body;

  try {
    const sql =
      "INSERT INTO appointments (apptid, pxid, doctorid, clinicid, status, TimeQueued, QueueDate, StartTime, EndTime, type, isVirtual) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
    const [result] = await phPool.query(sql, [
      apptid,
      pxid,
      doctorid,
      clinicid,
      status,
      TimeQueued,
      QueueDate,
      StartTime,
      EndTime,
      type,
      isVirtual,
    ]);
    res.status(200).send("Appointment created successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/clinics", async (req, res) => {
  try {
    const sql = "SELECT clinicid FROM clinics LIMIT 10;";
    const result = await phPool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/doctors", async (req, res) => {
  try {
    const sql = "SELECT doctorid FROM doctors LIMIT 10;";
    const result = await phPool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/px", async (req, res) => {
  try {
    const sql = "SELECT pxid FROM px LIMIT 10;";
    const result = await phPool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/report1", async (req, res) => {
  try {
    const sql = `SELECT YEAR(a.StartTime) as year, MONTH(a.StartTime) as month, COUNT(a.pxid) as count FROM appointments a GROUP BY YEAR(a.StartTime), MONTH(a.StartTime) ORDER BY YEAR(a.StartTime), MONTH(a.StartTime);`;
    const result = await phPool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/report2", async (req, res) => {
  try {
    const sql = `SELECT c.clinicid, ROUND(AVG(TIMESTAMPDIFF(HOUR, a.TimeQueued, a.EndTime)), 2) AS avg_wait_time_hours FROM appointments a JOIN clinics c ON a.clinicid = c.clinicid WHERE type = 'Consultation' AND c.RegionName = 'National Capital Region (NCR)' GROUP BY c.clinicid;`;
    const result = await phPool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/report3", async (req, res) => {
  try {
    const sql = `SELECT d.mainspecialty as specialty, type, ROUND(AVG(TIMESTAMPDIFF(HOUR, a.TimeQueued, a.StartTime)),2) AS avg_wait_time_hours FROM appointments a JOIN doctors d ON a.doctorid = d.doctorid GROUP BY d.mainspecialty,type ORDER BY d.mainspecialty;`;
    const result = await phPool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
