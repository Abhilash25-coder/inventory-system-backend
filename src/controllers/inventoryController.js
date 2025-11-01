import { pool } from "../db.js";
import { produceDummyEvents } from "../utils/dummyEvents.js";

export async function getProducts(req, res) {
  const { rows } = await pool.query(`
    SELECT product_id,
      COALESCE(SUM(quantity), 0) as total_qty,
      COALESCE(SUM(quantity * unit_price), 0) as total_cost,
      CASE WHEN SUM(quantity) > 0 THEN SUM(quantity * unit_price)/SUM(quantity)
           ELSE 0 END as avg_cost
    FROM inventory_batches
    GROUP BY product_id
  `);
  res.json(rows);
}

export async function getLedger(req, res) {
  const { rows } = await pool.query(`
    SELECT * FROM sales ORDER BY timestamp DESC
  `);
  res.json(rows);
}

export async function simulate(req, res) {
  await produceDummyEvents();
  res.json({ message: "Dummy events produced!" });
}
