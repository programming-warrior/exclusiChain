import { WebSocket, WebSocketServer } from "ws";
import RedisClientSingleton from "./utils/redis";
import { verifyWebSocketToken } from "./utils/auth";

// WebSocket Clients Store
const clients: { [username: string]: WebSocket } = {};

let redisSubscriberClient: any;
let redisCommandClient: any;


// Handle WebSocket Connection
async function handleConnection(wsConnection: WebSocket, req: any) {
  const secWebSocketProtocolHeaderIndex = req.rawHeaders.findIndex(
    (val: string) => /sec-websocket-protocol/i.test(val)
  );

  if (secWebSocketProtocolHeaderIndex === -1) {
    wsConnection.close();
    return;
  }

  const decodedValue = verifyWebSocketToken(
    req.rawHeaders[secWebSocketProtocolHeaderIndex + 1]
  );

  if (decodedValue) {
    clients[decodedValue.id] = wsConnection;

    wsConnection.on("close", async () => {
        console.log
      
        delete clients[decodedValue.id];
    });

  } else {

    console.log("closing websocket");
    wsConnection.close();
    console.error("Invalid token, connection closed.");
  }
}


async function subscribeToNotificationsUpdates() {
  try {
    await redisSubscriberClient.subscribe(
      "NOTIFICATIONS_UPDATES",
      (notification: any) => {
        const data = JSON.parse(notification);
        console.log("Notification received:", data);
        const wsData = {
          product_id: data.product_id,
          sender_id: data.sender_id,
          message: data.message
        }
        if (clients[data.receiver_id]) {
          console.log("sending data to the client " + data.receiver_id);
          clients[data.receiver_id].send(JSON.stringify(wsData));
        } else {
          console.warn(
            `No WebSocket client found for username: ${data.receiver_id}`
          );
        }
      }
    );

    console.log("Subscribed to NOTIFICATIONS_UPDATES");
  } catch (error) {
    console.error("Failed to subscribe to NOTIFICATIONS_UPDATES:", error);
  }
}

// Initialize Redis Connection and WebSocket Handling
async function main() {
  try {
    redisSubscriberClient = await RedisClientSingleton.getRedisClient();
    redisCommandClient = await RedisClientSingleton.getRedisClient();

    // // Redis event listeners
    // redisSubscriberClient.on("error", (err:any) =>
    //   console.error("Redis Client Error:", err)
    // );
    // redisSubscriberClient.on("connect", () =>
    //   console.log("Redis Client Connected")
    // );
    // redisSubscriberClient.on("ready", () => console.log("Redis Client Ready"));
    // redisSubscriberClient.on("reconnecting", () =>
    //   console.log("Redis Client Reconnecting")
    // );
    // redisSubscriberClient.on("debug", (message:any) =>
    //   console.log("Redis Debug:", message)
    // );

    console.log("Redis Command Client Connected");


    await subscribeToNotificationsUpdates();
    // WebSocket connection handling
    ws.on("connection", handleConnection);

    console.log("WebSocket server running on ws://localhost:4001");
  } catch (error: any) {
    console.error("Error during initialization:", error.message);
  }
}

const ws = new WebSocketServer({ port: 4001 });

// Start the main function
main();
