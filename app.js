// server.js
const e = require("express");
const express = require("express");
const mysql = require("mysql2/promise");
const app = express();

const logPool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost", // Replace with your MySQL host address
  port: "3306",
  user: "root", // Replace with your MySQL username
  password: "stadvdb", // Replace with your MySQL password
  database: "mco2log", // Replace with your database name
});

// Replace with your RDS configuration details
const phPool = mysql.createPool({
  connectionLimit: 10,
  host: "ccscloud.dlsu.edu.ph", // Replace with your MySQL host address
  port: "20039",
  user: "root", // Replace with your MySQL username
  password: "|STadvdb|13", // Replace with your MySQL password
  database: "mco1", // Replace with your database name
});

const luzonPool = mysql.createPool({
  connectionLimit: 10,
  host: "ccscloud.dlsu.edu.ph", // Replace with your MySQL host address
  port: "20040",
  user: "root", // Replace with your MySQL username
  password: "|STadvdb|13", // Replace with your MySQL password
  database: "mco1", // Replace with your database name
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

const fetchLog = async (region) => {
  const sql = `SELECT * FROM log WHERE pool = ? ORDER BY timestamp ASC`;
  try {
    const result = await logPool.query(sql, [region]);
    return result[0];
  } catch (error) {
    console.log("Failure connecting to log.");
    return null;
  }
};

const createLog = async (region, query) => {
  const sql = `INSERT INTO log (pool, query) VALUES (?, ?);`;
  try {
    const result = logPool.query(sql, [region, query]);
    return result;
  } catch (error) {
    console.log("Failed to modify log.");
    return result;
  }
};

const deleteLog = async (region, query) => {
  const sql = `DELETE FROM log WHERE pool = ?`;
  try {
    const result = logPool.query(sql, [region]);
    return result;
  } catch (error) {
    console.log("Failed to modify log.");
    return result;
  }
};

const checkPoolHealth = async (pool, region) => {
  let healthy = 0;
  try {
    await pool.query("SELECT 1").then(() => {
      console.log(`Pool ${region} healthy`);
      healthy = 1;
    }); // Simple SELECT query
  } catch (error) {
    console.error(`Pool ${region} is down!`);
    healthy = 0;
  }

  return healthy;
};

const executeQuery = async (
  action,
  query,
  region,
  fallbackRegion,
  fallbackRegion2 = null
) => {
  let result = null;

  const primaryRegionPool =
    region == "PH" ? phPool : region == "Luzon" ? luzonPool : visminPool;
  const fallbackRegionPool =
    fallbackRegion == "PH"
      ? phPool
      : fallbackRegion == "Luzon"
      ? luzonPool
      : visminPool;
  let fallbackRegion2Pool;
  let fallbackRegion2Healthy;

  if (fallbackRegion2) {
    fallbackRegion2Pool =
      fallbackRegion2 == "PH"
        ? phPool
        : fallbackRegion == "Luzon"
        ? luzonPool
        : visminPool;
    fallbackRegion2Healthy = await checkPoolHealth(
      fallbackRegion2Pool,
      fallbackRegion2
    );
  }

  const regionHealthy = await checkPoolHealth(primaryRegionPool, region);
  const fallbackRegionHealthy = await checkPoolHealth(
    fallbackRegionPool,
    fallbackRegion
  );

  // If the primary node that the query is going to go is healthy,
  if (regionHealthy) {
    // Get the recovery logs for the primary node.
    const fetchLogs = await fetchLog(region);

    // Try to recover the node by executing the logs that happened when the pool has been down.
    try {
      if (fetchLogs.length > 0) {
        for (const log of fetchLogs) {
          try {
            console.log("Recovering...");
            await primaryRegionPool.query(log.query);
          } catch (error) {
            console.log(error);
            console.log("Failed to recover.");
          }
        }
        await deleteLog(region);
      }

      // When the pool is done executing the logs, it will then execute the query.
      result = await primaryRegionPool.query(query);
      console.log(`Query success for ${region}`);
    } catch (error) {
      // If the query failed to execute or the logs failed to recover, the whole function will execute again. With this,
      // we can recursively check for node pool health.
      console.log("Failed request to primary node. Retrying...");
      let retries = 0;
      while (retries < 3) {
        try {
          if (recoveryLogs.length > 0) {
            for (const log of recoveryLogs) {
              try {
                await primaryRegionPool.query(log.query);
              } catch (error) {
                console.log("Failed to recover.");
              }
            }
            deleteLog(region);
          }

          // When the pool is done executing the logs, it will then execute the query.
          result = await primaryRegionPool.query(query);
        } catch (error) {
          console.log(`Failed request to primary node. Retries: ${retries}`);
          retries++;
        }
      }
      if (retries == 3) console.log("Failed to execute query.");
    }
  }

  if (fallbackRegionHealthy && !result) {
    try {
      // Execute the change towards an available region, and create a change log for the failed change towards the node the request was going to go to.
      // Only log the change in case of updates and inserts.
      result = await fallbackRegionPool.query(query);
      if (result && action != "select") createLog(region, query);
      console.log(`Query success for ${fallbackRegion}`);
    } catch (error) {
      console.log(error);
      // If the query failed to execute or the logs failed to recover, the whole function will execute again. With this,
      // we can recursively check for node pool health.
      console.log("Failed request to fallback node 1. Retrying...");
      let retries = 0;

      while (retries < 3) {
        try {
          result = await fallbackRegionPool.query(query);
          if (result && action != "select") createLog(region, query);
        } catch (error) {
          console.log(`Failed request to fallback node 1. Retries: ${retries}`);
          retries++;
        }
      }

      if (retries == 3) console.log("Failed to execute query.");
    }
  }

  if (fallbackRegion2 && fallbackRegion2Healthy && !result) {
    try {
      // Execute the change towards an available region, and create a change log for the failed change towards the node the request was going to go to.
      // Only log the change in case of updates and inserts.
      result = await fallbackRegion2Pool.query(query);
      if (result && action != "select") createLog(region, query);
      console.log(`Query success for ${fallbackRegion2}`);
    } catch (error) {
      // If the query failed to execute or the logs failed to recover, the whole function will execute again. With this,
      // we can recursively check for node pool health.
      console.log("Failed request to fallback node 2. Retrying...");
      let retries = 0;

      while (retries < 3) {
        try {
          result = await fallbackRegionPool.query(query);
          if (result && action != "select") createLog(region, query);
        } catch (error) {
          console.log(`Failed request to fallback node 2. Retries: ${retries}`);
          retries++;
        }
      }
    }
  }

  return result ? result[0] : null;
};

app.use(express.json());
app.use(express.static("src"));

app.get("/appointments", async (req, res) => {
  try {
    const sql = "SELECT * FROM appointments ORDER BY EndTime DESC LIMIT 20;";
    const result = await executeQuery("select", sql, "PH", "Luzon", "VisMin");

    if (result == null) {
      res.status(404).send("Appointment not found.");
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// viewing a specific appointment
app.get("/appointments/:id", async (req, res) => {
  const appointmentId = req.params.id;
  const sql = `SELECT * FROM appointments WHERE apptid = '${appointmentId}'`;

  try {
    let result;
    result = await executeQuery("select", sql, "Luzon", "VisMin", "PH");

    if (result == null || result.length == 0) {
      result = await executeQuery("select", sql, "VisMin", "PH");

      if (result == null || result.length == 0) {
        result = await executeQuery("select", sql, "PH", "Luzon");
      }
    }

    if (result == null) {
      res.status(404).send("Appointment not found.");
    } else {
      res.status(200).json(result);
    }

    res.status(200);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// edit appointment
app.put("/appointments/:id/:region", async (req, res) => {
  const appointmentId = req.params.id;
  const { TimeQueued, QueueDate, StartTime, EndTime, isVirtual, status, type } =
    req.body;
  const appointmentRegion = req.params.region;
  const sql = `UPDATE appointments SET TimeQueued = '${TimeQueued}', QueueDate = '${QueueDate}', StartTime = '${StartTime}', EndTime = '${EndTime}', isVirtual = ${
    isVirtual ? "1" : "0"
  }, status = '${status}', type = '${type}' WHERE apptid = '${appointmentId}'`;

  try {
    let result;

    if (appointmentRegion == "Luzon") {
      result = await executeQuery("update", sql, "PH", "Luzon");
      if (result) await executeQuery("update", sql, "Luzon", "PH");
    } else if (
      appointmentRegion == "Visayas" ||
      appointmentRegion == "Mindanao"
    ) {
      result = await executeQuery("update", sql, "PH", "Vismin");
      if (result) await executeQuery("update", sql, "Vismin", "PH");
    }

    res.status(200);
    if (result == null) {
      res.status(404).send("Appointment not found.");
    } else {
      res.status(200).json(result);
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
    const searchClinic = `SELECT c.RegionName FROM clinics c WHERE clinicid = '${clinicid}'`;
    const result1 = await executeQuery(
      "select",
      searchClinic,
      "PH",
      "Luzon",
      "Vismin"
    );

    const appointmentRegion = result1[0].RegionName;

    const createSQL = `INSERT INTO appointments (\`apptid\`, \`pxid\`, \`doctorid\`, \`clinicid\`, \`status\`, \`TimeQueued\`, \`QueueDate\`, \`StartTime\`, \`EndTime\`, \`type\`, \`isVirtual\`, \`region\`) VALUES ('${apptid}', '${pxid}', '${doctorid}', '${clinicid}', '${status}', '${TimeQueued}', '${QueueDate}', '${StartTime}', '${EndTime}', '${type}', ${
      isVirtual ? "1" : "0"
    }, '${appointmentRegion}') AS newAppt ON DUPLICATE KEY UPDATE apptid = newAppt.apptid`;

    if (appointmentRegion == "Luzon") {
      const result = await executeQuery("insert", createSQL, "PH", "Luzon");
      if (result) await executeQuery("insert", createSQL, "Luzon", "PH");
    } else if (
      appointmentRegion == "Visayas" ||
      appointmentRegion == "Mindanao"
    ) {
      const result = await executeQuery("insert", createSQL, "PH", "Vismin");
      if (result) await executeQuery("insert", createSQL, "Vismin", "PH");
    }

    res.status(200).send("Appointment created successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/clinics", async (req, res) => {
  try {
    const sql = "SELECT clinicid FROM clinics LIMIT 10;";
    const result = await executeQuery("select", sql, "PH", "Luzon", "VisMin");

    if (result == null) {
      res.status(404).send("Clinics not found.");
    } else {
      res.status(200).json(result);
    }

    res.status(200) /* .json(result) */;
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/doctors", async (req, res) => {
  try {
    const sql = "SELECT doctorid FROM doctors LIMIT 10;";
    const result = await executeQuery("select", sql, "PH", "Luzon", "VisMin");

    if (result == null) {
      res.status(404).send("Doctors not found.");
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/px", async (req, res) => {
  try {
    const sql = "SELECT pxid FROM px LIMIT 10;";
    const result = await executeQuery("select", sql, "PH", "Luzon", "VisMin");

    if (result == null) {
      res.status(404).send("PX not found.");
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/report1", async (req, res) => {
  try {
    const sql = `SELECT YEAR(a.StartTime) as year, MONTH(a.StartTime) as month, COUNT(a.pxid) as count FROM appointments a GROUP BY YEAR(a.StartTime), MONTH(a.StartTime) ORDER BY YEAR(a.StartTime), MONTH(a.StartTime);`;
    const result = await executeQuery("select", sql, "PH", "Luzon", "VisMin");

    if (result == null) {
      res.status(404).send("Report failed to generate.");
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/report2", async (req, res) => {
  try {
    const sql = `SELECT c.clinicid, ROUND(AVG(TIMESTAMPDIFF(HOUR, a.TimeQueued, a.EndTime)), 2) AS avg_wait_time_hours FROM appointments a JOIN clinics c ON a.clinicid = c.clinicid WHERE type = 'Consultation' AND c.RegionName = 'National Capital Region (NCR)' GROUP BY c.clinicid;`;
    const result = await executeQuery("select", sql, "PH", "Luzon", "VisMin");

    if (result == null) {
      res.status(404).send("Report failed to generate.");
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/report3", async (req, res) => {
  try {
    const sql = `SELECT d.mainspecialty as specialty, type, ROUND(AVG(TIMESTAMPDIFF(HOUR, a.TimeQueued, a.StartTime)),2) AS avg_wait_time_hours FROM appointments a JOIN doctors d ON a.doctorid = d.doctorid GROUP BY d.mainspecialty,type ORDER BY d.mainspecialty;`;
    const result = await executeQuery("select", sql, "PH", "Luzon", "VisMin");

    if (result == null) {
      res.status(404).send("Report failed to generate.");
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
