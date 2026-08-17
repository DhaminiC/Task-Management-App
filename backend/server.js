const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// =====================================================
// MYSQL CONNECTION
// =====================================================

const db = mysql.createConnection({

    host: "localhost",
    user: "root",
    password: "5552",
    database: "taskflow"

});


// =====================================================
// CONNECT TO MYSQL
// =====================================================

db.connect((err) => {

    if (err) {

        console.log("Database Connection Failed");
        console.log(err);

        return;
    }

    console.log("✅ MySQL Connected Successfully");

});


// =====================================================
// TEST
// =====================================================

app.get("/", (req, res) => {

    res.send("TaskFlow Backend Running");

});


// =====================================================
// REGISTER
// =====================================================

app.post("/register", (req, res) => {

    console.log("Register API Called");
    console.log(req.body);

    const {
        fullname,
        email,
        password
    } = req.body;


    const sql =
        "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";


    db.query(
        sql,
        [fullname, email, password],
        (err, result) => {

            if (err) {

                console.log(err);

                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(409).json({
                        message: "Email already registered."
                    });

                }

                return res.status(500).json({
                    message: "Registration Failed"
                });

            }


            res.json({
                message: "Registration Successful"
            });

        }
    );

});


// =====================================================
// LOGIN
// =====================================================

app.post("/login", (req, res) => {

    console.log("Login API Called");
    console.log(req.body);

    const {
        email,
        password
    } = req.body;


    const sql =
        "SELECT * FROM users WHERE email = ? AND password = ?";


    db.query(
        sql,
        [email, password],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Login Failed"
                });

            }


            if (results.length === 0) {

                return res.status(401).json({
                    message: "Invalid Email or Password"
                });

            }


            const user = results[0];


            res.json({

                message: "Login Successful",

                userId: user.id,

                fullname: user.fullname

            });

        }
    );

});


// =====================================================
// ADD TASK
// =====================================================

app.post("/add-task", (req, res) => {

    console.log("Add Task API Called");
    console.log(req.body);


    const {
        title,
        description,
        due_date,
        priority,
        status,
        user_id
    } = req.body;


    const sql = `

        INSERT INTO tasks
        (
            title,
            description,
            due_date,
            priority,
            status,
            user_id
        )

        VALUES (?, ?, ?, ?, ?, ?)

    `;


    db.query(
        sql,
        [
            title,
            description,
            due_date,
            priority,
            status,
            user_id
        ],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Task Saving Failed"
                });

            }


            console.log("✅ Task Saved Successfully");


            res.json({
                message: "Task Added Successfully"
            });

        }
    );

});


// =====================================================
// GET ONLY LOGGED-IN USER'S TASKS
// =====================================================

app.get("/tasks/:user_id", (req, res) => {

    console.log("Get User Tasks API Called");


    const user_id = req.params.user_id;


    const sql = `

        SELECT *
        FROM tasks
        WHERE user_id = ?
        ORDER BY id DESC

    `;


    db.query(
        sql,
        [user_id],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Unable to get tasks"
                });

            }


            res.json(results);

        }
    );

});


// =====================================================
// GET SINGLE TASK
// =====================================================

app.get("/task/:id", (req, res) => {

    const taskId = req.params.id;


    const sql =
        "SELECT * FROM tasks WHERE id = ?";


    db.query(
        sql,
        [taskId],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Unable to get task"
                });

            }


            if (results.length === 0) {

                return res.status(404).json({
                    message: "Task not found"
                });

            }


            res.json(results[0]);

        }
    );

});


// =====================================================
// UPDATE TASK
// =====================================================

app.put("/update-task/:id", (req, res) => {

    console.log("Update Task API Called");


    const taskId = req.params.id;


    const {
        title,
        description,
        due_date,
        priority,
        status
    } = req.body;


    const sql = `

        UPDATE tasks

        SET
            title = ?,
            description = ?,
            due_date = ?,
            priority = ?,
            status = ?

        WHERE id = ?

    `;


    db.query(
        sql,
        [
            title,
            description,
            due_date,
            priority,
            status,
            taskId
        ],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Task Update Failed"
                });

            }


            res.json({
                message: "Task Updated Successfully"
            });

        }
    );

});


// =====================================================
// DELETE TASK
// =====================================================

app.delete("/delete-task/:id", (req, res) => {

    console.log("Delete Task API Called");


    const taskId = req.params.id;


    const sql =
        "DELETE FROM tasks WHERE id = ?";


    db.query(
        sql,
        [taskId],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    message: "Task Delete Failed"
                });

            }


            res.json({
                message: "Task Deleted Successfully"
            });

        }
    );

});


// =====================================================
// START SERVER
// =====================================================

app.listen(5000, () => {

    console.log("Server running on port 5000");

});