import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { initDB } from "./db.js";
import inventoryRoutes from "./routes/inventoryRoute.js";
import { startConsumer } from "./kafka/consumer.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", inventoryRoutes);

app.get("/", (req, res) => res.send("Inventory Backend Running ✅"));

app.listen(config.PORT, async () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
  try {
    await initDB();
    await startConsumer();
  } catch (error) {
    console.error("❌ Startup failed:", error.message);
    process.exit(1);
  }
});
