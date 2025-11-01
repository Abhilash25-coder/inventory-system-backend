import { Kafka } from "kafkajs";
import { config } from "../config.js";

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
const producer = kafka.producer();
const products = ["PRD001", "PRD002", "PRD003", "PRD004", "PRD005", "PRD006", "PRD007", "PRD008", "PRD009", "PRD010"];

export async function produceDummyEvents() {
  await producer.connect();

  const events = [
    { product_id: "PRD001", event_type: "purchase", quantity: 50, unit_price: 100, timestamp: new Date().toISOString() },
    { product_id: "PRD001", event_type: "purchase", quantity: 30, unit_price: 110, timestamp: new Date().toISOString() },
    { product_id: "PRD001", event_type: "sale", quantity: 40, timestamp: new Date().toISOString() },
  ];

  for (const e of events) {
    await producer.send({
      topic: config.KAFKA_TOPIC,
      messages: [{ value: JSON.stringify(e) }],
    });
  }

  await producer.disconnect();
  console.log("✅ Dummy Kafka events produced");
}

export async function startAutoProducer() {
  try {
    await producer.connect();
    console.log("⚙️ Auto producer started (sending events every 10 s)");

    setInterval(async () => {
      try {
        const product = products[Math.floor(Math.random() * products.length)];
        const eventType = Math.random() > 0.5 ? "purchase" : "sale";

        const event = {
          product_id: product,
          event_type: eventType,
          quantity: Math.floor(Math.random() * 20) + 5,
          ...(eventType === "purchase" && { unit_price: Math.floor(90 + Math.random() * 20) }),
          timestamp: new Date().toISOString(),
        };

        await producer.send({
          topic: config.KAFKA_TOPIC,
          messages: [{ value: JSON.stringify(event) }],
        });

        console.log("📤 Auto event:", event);
      } catch (error) {
        // Check if error is due to disconnected producer
        if (error.message?.includes("disconnected") || error.message?.includes("The producer is disconnected")) {
          console.warn("⚠️ Producer disconnected, attempting to reconnect...");
          try {
            await producer.connect();
            console.log("✅ Producer reconnected");
          } catch (reconnectError) {
            console.error("❌ Failed to reconnect producer:", reconnectError.message);
          }
        } else {
          console.error("❌ Error sending auto event:", error.message);
        }
      }
    }, 10000); // every 10 s
  } catch (error) {
    console.error("❌ Failed to start auto producer:", error.message);
    throw error;
  }
}
