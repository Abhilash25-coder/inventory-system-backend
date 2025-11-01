import express from "express";
import { getProducts, getLedger, simulate } from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/products", getProducts);
router.get("/ledger", getLedger);
router.post("/simulate", simulate);

export default router;
