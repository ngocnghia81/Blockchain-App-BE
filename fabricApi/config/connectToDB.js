const mysql = require("mysql2");
const util = require("util");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to MySQL Server");
});

db.query = util.promisify(db.query);

module.exports = db;
