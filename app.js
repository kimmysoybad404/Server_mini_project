const con = require('./db');
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// login service
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT id, password FROM users WHERE username = ?";
    con.query(sql, [username], function (err, results) {
        if (err) {
            return res.status(500).send("Database server error");
        }
        if (results.length != 1) {
            return res.status(401).send("Wrong username");
        }
        // compare passwords
        bcrypt.compare(password, results[0].password, function (err, same) {
            if (err) {
                return res.status(500).send("Hashing error");
            }
            if (same) {
                return res.send("Login OK");   
            }
            return res.status(401).send("Wrong password");
        });
    })
});

//show expense service
app.get('/expense', (_req, res) => {
    const username = _req.query.username;
    
    const sql_id = "SELECT id FROM users WHERE username = ?";
    con.query(sql_id, [username], function (err, userid) {
        if (err) {
            return res.status(500).send("Database server error");
        }

        if (userid.length === 0) {
            return res.status(404).send("User not found.");
        }

        const sql = "SELECT * FROM expense WHERE user_id = ?";
        con.query(sql, [userid[0].id], function (err, results) {
            
            if (err) {
                return res.status(500).send("Database server error");
            }
            res.json(results);
        })
    })

});

// show today expense service
app.get('/todayexpense', (_req, res) => {
    const username = _req.query.username;
    
    const sql_id = "SELECT id FROM users WHERE username = ?";
    con.query(sql_id, [username], function (err, userid) {
        if (err) {
            return res.status(500).send("Database server error");
        }

        if (userid.length === 0) {
            return res.status(404).send("User not found.");
        }

        const sql = "SELECT * FROM expense WHERE user_id = ? AND DATE(date) = CURDATE();";
        con.query(sql, [userid[0].id], function (err, results) {
            
            if (err) {
                return res.status(500).send("Database server error");
            }
            res.json(results);
        })
    })

});

// search expense service
app.get('/searchexpense', (_req, res) => {
    const username = _req.query.username;
    const keyword = _req.query.keyword;

    const sql_id = "SELECT id FROM users WHERE username = ?";
    con.query(sql_id, [username], function (err, userid) {
        if (err) {
            return res.status(500).send("Database server error");
        }
        if (userid.length === 0) {
            return res.status(404).send("User not found.");
        }

        const sql = "SELECT * FROM expense WHERE user_id = ? AND item LIKE ?";
        con.query(sql, [userid[0].id, `%${keyword}%`], function (err, results) {
            if (err) {
                return res.status(500).send("Database server error");
            }
            res.json(results);
        });
    });
});


app.get('/addexpense', (_req, res) => {
    // add service
});

app.delete('/deleteexpense/:id', (req, res) => {
    const id = req.params.id;
    const username = req.query.username;

    // ดึง user_id จาก username
    const sql_id = "SELECT id FROM users WHERE username = ?";
    con.query(sql_id, [username], function (err, userid) {
        if (err) return res.status(500).send("Database server error");
        if (userid.length === 0) return res.status(404).send("User not found.");

        // ลบเฉพาะถ้าเป็นของ user นี้เท่านั้น
        const sql = "DELETE FROM expense WHERE id = ? AND user_id = ?";
        con.query(sql, [id, userid[0].id], function (err, result) {
            if (err) return res.status(500).send("Database server error");
            if (result.affectedRows === 0) return res.status(404).send("Expense not found or not owned by user.");
            res.send("Expense deleted successfully");
        });
    });
});



// ---------- Server starts here ---------
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running at ' + PORT);
});
