const { Pool } = require("pg");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: {
                  rejectUnauthorized: false,
              },
          }
        : {
              user: process.env.DB_USER,
              host: process.env.DB_HOST,
              database: process.env.DB_NAME,
              password: process.env.DB_PASSWORD,
              port: process.env.DB_PORT,
          }
);
pool.query("SELECT current_database()")
    .then(res => console.log("Backend DB:", res.rows[0].current_database))
    .catch(console.error);

module.exports = pool;