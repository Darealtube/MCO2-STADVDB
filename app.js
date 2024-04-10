// server.js
const express = require("express");
const mysql = require("mysql2/promise");
const AWS = require("aws-sdk"); // Assuming AWS SDK for external monitoring
const app = express();

pool
  .query("SELECT * FROM appointments")
  .then((results) => {
    console.log("Connection successful and query executed!");
  })
  .catch((err) => {
    console.error("Error connecting or executing query:", err);
  });

// Replace with your RDS configuration details
const masterConfig = {
  connectionLimit: 10,
  host: "mco2.cpsqomyoe0wj.ap-southeast-2.rds.amazonaws.com", // Replace with your MySQL host address
  port: "3306",
  user: "admin", // Replace with your MySQL username
  password: "STADVDB13", // Replace with your MySQL password
  database: "mco1", // Replace with your database name
  queueLimit: 0,
  waitForConnections: true,
};
const slave1Config = {
  /* Similar configuration for slave 1 */
};
const slave2Config = {
  /* Similar configuration for slave 2 */
};

// Connection pools (initialize as needed)
let masterPool;
let promotedSlavePool;

// Health check interval (adjust as necessary)
const healthCheckInterval = 5000; // 5 seconds

async function connectToMaster() {
  try {
    masterPool = await mysql.createPool(masterConfig);
    console.log("Connected to master database");
  } catch (error) {
    console.error("Failed to connect to master:", error);
    // Handle master connection error (e.g., retry)
  }
}

async function connectToSlave(slaveConfig) {
  try {
    promotedSlavePool = await mysql.createPool(slaveConfig);
    console.log("Connected to promoted slave database");
  } catch (error) {
    console.error("Failed to connect to slave:", error);
    // Handle slave connection error (e.g., retry)
  }
}

async function performHealthCheck() {
  // Implement health check using PING statement
  if (masterPool) {
    try {
      const [rows] = await masterPool.query("SELECT 1");
      console.log("Master health check successful");
    } catch (error) {
      console.error("Master health check failed:", error);
      // Handle master failure (trigger failover)
      await handleMasterFailure();
    }
  }
}

async function handleMasterFailure() {
  try {
    if (masterPool) {
      await masterPool.end(); // Close connection pool to master
      masterPool = null; // Clear reference
    }

    // Choose a slave for promotion (e.g., based on lag or load)
    const chosenSlaveConfig = slave1Config; // Replace with logic
    await connectToSlave(chosenSlaveConfig); // Connect to chosen slave

    // Update application logic to use promotedSlavePool
  } catch (error) {
    console.error("Error during failover:", error);
    // Handle failover errors (e.g., retry)
  }
}

(async () => {
  await connectToMaster();

  // Start health checks at regular intervals
  setInterval(performHealthCheck, healthCheckInterval);
})();

app.use(express.json());
app.use(express.static("src"));

app.get("/appointments", async (req, res) => {
  try {
    const sql = "SELECT * FROM appointments ORDER BY EndTime DESC LIMIT 20;";
    const result = await pool.query(sql);
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
    const [results] = await pool.query(sql, [appointmentId]);

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
    const [result] = await pool.query(sql, [appointmentData, appointmentId]);

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
    const [result] = await pool.query(sql, [
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
    const result = await pool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/doctors", async (req, res) => {
  try {
    const sql = "SELECT doctorid FROM doctors LIMIT 10;";
    const result = await pool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/px", async (req, res) => {
  try {
    const sql = "SELECT pxid FROM px LIMIT 10;";
    const result = await pool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/report1", async (req, res) => {
  try {
    const sql = `SELECT YEAR(a.StartTime) as year, MONTH(a.StartTime) as month, COUNT(a.pxid) as count FROM appointments a GROUP BY YEAR(a.StartTime), MONTH(a.StartTime) ORDER BY YEAR(a.StartTime), MONTH(a.StartTime);`;
    const result = await pool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/report2", async (req, res) => {
  try {
    const sql = `SELECT c.clinicid, ROUND(AVG(TIMESTAMPDIFF(HOUR, a.TimeQueued, a.EndTime)), 2) AS avg_wait_time_hours FROM appointments a JOIN clinics c ON a.clinicid = c.clinicid WHERE type = 'Consultation' AND c.RegionName = 'National Capital Region (NCR)' GROUP BY c.clinicid;`;
    const result = await pool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/report3", async (req, res) => {
  try {
    const sql = `SELECT d.mainspecialty as specialty, type, ROUND(AVG(TIMESTAMPDIFF(HOUR, a.TimeQueued, a.StartTime)),2) AS avg_wait_time_hours FROM appointments a JOIN doctors d ON a.doctorid = d.doctorid GROUP BY d.mainspecialty,type ORDER BY d.mainspecialty;`;
    const result = await pool.query(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
