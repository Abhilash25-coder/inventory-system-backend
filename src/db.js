import pkg from "pg";
const { Pool } = pkg;

import { config } from "./config.js";

// Validate DATABASE_URL before creating pool
if (!config.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Please set it in your .env file.");
}

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_URL?.includes("render.com") ? { rejectUnauthorized: false } : false,
});

// Handle pool errors
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products(
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS inventory_batches(
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) REFERENCES products(product_id),
        quantity INT,
        unit_price FLOAT,
        timestamp TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales(
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) REFERENCES products(product_id),
        quantity INT,
        total_cost FLOAT,
        timestamp TIMESTAMP
      );
    `);
    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    throw error;
  }
}
