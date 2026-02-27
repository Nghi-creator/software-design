import knex from "knex";
import dotenv from "dotenv";
dotenv.config();

export default knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: { min: 0, max: 7 },
});
