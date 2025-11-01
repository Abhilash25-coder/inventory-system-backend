import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  KAFKA_BROKER: process.env.KAFKA_BROKER || "localhost:9092",
  KAFKA_TOPIC: "inventory-events",
  KAFKA_USERNAME: process.env.KAFKA_USERNAME,
  KAFKA_PASSWORD: process.env.KAFKA_PASSWORD,
  KAFKA_SASL_MECHANISM: process.env.KAFKA_SASL_MECHANISM || "scram-sha-256",
};
