
import dotenv from "dotenv";
import RedisClientSingleton from "./utils/redis";
import { NotificationJob } from "./jobs/NotificationJob";

dotenv.config();

const processJobs = async () => {
  console.log("connecting to redis");
  const redisClient = await RedisClientSingleton.getRedisClient();
  console.log("redis connected");

  const queues = [
    "NOTIFICATION_QUEUE",
  ];

  while (true) {
    for (const queue of queues) {
      try {
        const jobString = await redisClient.rPop(queue);
        if (jobString) {
          const job = JSON.parse(jobString)

          switch (queue) {
         
            case "NOTIFICATION_QUEUE": {
              const notificationJob = new NotificationJob(
                job.receiver_id,
                job.event,
                job.data,
                redisClient
              );
              await notificationJob.process();
              break;
            }
  
            default: {
              break;
            }
          }

        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
};

processJobs();


