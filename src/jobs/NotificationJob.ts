import { RedisClientType } from "redis";
import prisma from "../utils/db";


export class NotificationJob {
  private notificationEvents: string[];

  constructor(
    public receiver_id: string,
    public event: string,
    public data: any,       
    public redisClient: RedisClientType
  ) {
    this.notificationEvents = [
      "PRODUCT_TRANSFER_REQUEST"
    ];
  }

  async process() {
    try {
      // Check if the event is valid
      if (!this.notificationEvents.includes(this.event)) {
        console.warn("Unhandled notification event:", this.event);
        return;
      }

      // Create notification data based on the event type
      const notificationData = {
        receiver_id: this.receiver_id,
        event: this.event,
        data: this.data,
      };

      // Save notification in the database
    //   const savedNotification = await prisma.notification.create({ data: notificationData });

      // Publish the notification to Redis
      await this.redisClient.publish(
        "NOTIFICATIONS_UPDATES",
        JSON.stringify({ ...notificationData})
      );
    } catch (error) {
      console.error("Error processing notification:", error);
    }
  }
}
