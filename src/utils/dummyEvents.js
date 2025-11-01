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
