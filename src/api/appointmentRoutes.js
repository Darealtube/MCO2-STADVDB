const express = require("express");
const router = express.Router();
const pool = require('../../app.js');

function errorFn(err){
    console.log('Error found');
    console.error(err);
}

router.get("/appointments", async (req, res) => {

});

// viewing a specific appointment 
router.get("/appointments/:id", async (req, res) => {
    const appointmentId = req.params.id;

    try{
        const sql = 'SELECT * FROM appointments WHERE id = ?';
        const [results] = await pool.query(sql, [appointmentId]);

        if (results.length > 0)
        {
            const appointment = results[0];
            res.status(200).json(appointment); 
        } else 
        {
            res.status(404).send('Appointment not found');
        }
    }catch(error){
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// edit appointment
router.put("/appointments/:id", async (req,res) => {
    const appointmentId = req.params.id; 
    const appointmentData = req.body; 

    try 
    {
        const sql = 'UPDATE appointments SET (insert) WHERE id = ?';
        const [result] = await pool.query(sql,[...appointmentData, appointmentId]);
        
        if (result.affectedRows > 0)
        {
            res.status(200).send('Appointment updated successfully!');
        } else {
            res.status(404).send('Error occurred while trying to update the appointment');
        }
    
    } catch (error)
    {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}); 

// creating appointment
router.post('/create_appointment', async function(req, resp){ 
    const appointmentData = req.body;
    
    try{
        const sql = 'INSERT INTO appointments (apptid, pxid, doctorid, clinicid, status, timequeued, queuedate, starttime, endtime, type, isvirtual) VALUES (?,?,?,?,?,?,?,?,?,?,?)'; 
        const [result] = await pool.query(sql, appointmentData);
        resp.status(201).send('Appointment created successfully!');
    } catch (error)
    {
        console.error(error);
        resp.status(500).send('Internal Server Error');
    }
});

module.exports = router;
