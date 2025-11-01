import { pool } from "../db.js";

// On purchase, add a batch
export async function handlePurchase(event) {
  const { product_id, quantity, unit_price, timestamp } = event;

  await pool.query(
    `INSERT INTO products (product_id) VALUES ($1)
     ON CONFLICT (product_id) DO NOTHING;`,
    [product_id]
  );

  await pool.query(
    `INSERT INTO inventory_batches (product_id, quantity, unit_price, timestamp)
     VALUES ($1, $2, $3, $4)`,
    [product_id, quantity, unit_price, timestamp]
  );
}

// On sale, apply FIFO and consume batches
export async function handleSale(event) {
  const { product_id, quantity, timestamp } = event;

  // Ensure product exists before processing sale (to satisfy foreign key constraint)
  await pool.query(
    `INSERT INTO products (product_id) VALUES ($1)
     ON CONFLICT (product_id) DO NOTHING;`,
    [product_id]
  );

  let remaining = quantity;
  let totalCost = 0;

  const { rows: batches } = await pool.query(
    `SELECT * FROM inventory_batches
     WHERE product_id = $1
     ORDER BY timestamp ASC`,
    [product_id]
  );

  for (let batch of batches) {
    if (remaining <= 0) break;

    const consumeQty = Math.min(batch.quantity, remaining);
    totalCost += consumeQty * batch.unit_price;
    remaining -= consumeQty;

    const newQty = batch.quantity - consumeQty;

    if (newQty > 0) {
      await pool.query(
        `UPDATE inventory_batches SET quantity = $1 WHERE id = $2`,
        [newQty, batch.id]
      );
    } else {
      await pool.query(`DELETE FROM inventory_batches WHERE id = $1`, [batch.id]);
    }
  }

  // Insert sale record (product exists now, so foreign key constraint is satisfied)
  await pool.query(
    `INSERT INTO sales (product_id, quantity, total_cost, timestamp)
     VALUES ($1, $2, $3, $4)`,
    [product_id, quantity, totalCost, timestamp]
  );
}
