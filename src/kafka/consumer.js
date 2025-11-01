import { Kafka } from "kafkajs";
import { config } from "../config.js";
import { handlePurchase, handleSale } from "../services/fifoServices.js";

export async function startConsumer() {
  const kafkaConfig = {
    clientId: "inventory-client",
    brokers: [config.KAFKA_BROKER],
  };

  // Only add SASL if credentials are provided (for cloud/remote brokers)
  if (config.KAFKA_USERNAME && config.KAFKA_PASSWORD) {
    kafkaConfig.ssl = true;
    kafkaConfig.sasl = {
      mechanism: config.KAFKA_SASL_MECHANISM,
      username: config.KAFKA_USERNAME,
      password: config.KAFKA_PASSWORD,
    };
  }

  const kafka = new Kafka(kafkaConfig);

  const consumer = kafka.consumer({ groupId: "inventory-group" });
  await consumer.connect();
  await consumer.subscribe({ topic: config.KAFKA_TOPIC, fromBeginning: true });

  console.log("🟢 Kafka consumer connected to Redpanda Cloud");

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log("📥 Event:", event);

        if (event.event_type === "purchase") {
          await handlePurchase(event);
        } else if (event.event_type === "sale") {
          await handleSale(event);
        } else {
          console.warn("⚠️ Unknown event type:", event.event_type);
        }
      } catch (error) {
        console.error("❌ Error processing message:", error.message);
        console.error("Event data:", message.value.toString());
        // Don't rethrow - let KafkaJS handle retries
      }
    },
  });
}
