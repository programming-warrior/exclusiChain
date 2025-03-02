import { Router } from "express";
import { authMiddleware } from "../../utils/auth";
import prisma from "../../utils/db";
import RedisClientSingleton from "../../utils/redis";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
const ProductRouter = Router();

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

function generateOTP(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

ProductRouter.put("/transfer-ownership/:id", authMiddleware,async (req: any, res: any) => {
  const redisClient = await RedisClientSingleton.getRedisClient();
  if(!req.user || !req.user.id) return res.status(401).json({ error: "Unauthorized" });

  const user_id = req?.user?.id;

  const { id } = req.params;
  console.log(id);

  if (!user_id) return res.status(400).json({ error: "invalid input" });
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });
  if (!product) return res.status(404).json({ error: "product not found" });
  const user = await prisma.user.findUnique({
    where: {
      id: user_id,
    },
  });
  if (!user) return res.status(404).json({ error: "user not found" });

  const receiver = await prisma.user.findUnique({
    where: {
      id: product.ownerId || "",
    },
  });

  if (!receiver) {
    return res.status(400).json({ error: "Product hasn't been sold yet" });
  }

  const otp = generateOTP();

  console.log(otp);

  await redisClient.set(user_id, otp, { EX: 60 * 5 });

  await redisClient.lPush(
    "NOTIFICATION_QUEUE",
    JSON.stringify({
      receiver_id: product.ownerId,
      event: "PRODUCT_TRANSFER_REQUEST",
      data: {
        sender_id: user_id,
        product_id: product.id,
        otp: otp,
        message:
          "user " +
          user.name +
          " has requested to transfer the product " +
          product.title +
          " to you",
      },
    })
  );

  if (receiver) {
    const params = {
      Message: `Your OTP for product transfer has been sent to your phone. Valid for 5 minutes.`,
      PhoneNumber: receiver.phone,
      MessageAttributes: {
        "AWS.SNS.SMS.SenderID": {
          DataType: "String",
          StringValue: "PRODUCT",
        },
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    console.log(response);
  }

  // const txHash = await aptosService.transfer(product.ownerId, user.id, product.id);

  return res.status(200).json({
    product_id: product.id,
    requested_user_id: user_id,
  });
});

ProductRouter.post("/verify-otp", authMiddleware, async (req: any, res: any) => {
  const { otp, requested_user_id, product_id } = req.body;
  const redisClient = await RedisClientSingleton.getRedisClient();
  const user_id = req?.user?.id;
  if(!user_id) return res.status(401).json({ error: "Unauthorized" });
  const storedOTP = await redisClient.get(user_id);
  if (storedOTP !== otp) return res.status(400).json({ error: "invalid otp" });
  await redisClient.del(user_id);

  const user = await prisma.user.findUnique({
    where: {
      id: requested_user_id,
    },
  });
  if (!user) return res.status(500).json({ error: "something went wrong" });
  
  await prisma.product.update({
    where: {
      id: product_id,
    },
    data: {
      ownerId: requested_user_id
    },
  });

  return res.status(200).json({ message: "otp verified" });
});

ProductRouter.post("/authenticate-product", async (req: any, res: any) => {
  const { product_id, brand_id, phone, email } = req.body;
  if (!product_id) return res.status(400).json({ error: "invalid input" });
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: product_id,
      },
      include: {
        brand: true,
        owner: true,
      },
    });

    if (!product) return res.status(404).json({ error: "product not found" });

    const owner = {
      id: product.owner ? product.owner.id : product.brand?.id,
      name: product.owner ? product.owner.name : product.brand?.brand_name,
      email: product.owner ? product.owner.email : product.brand?.contact_email,
      phone: product.owner ? product.owner.phone : product.brand?.contact_phone,
    };

    return res.status(200).json(owner);
  } catch (error) {
    console.error("Error authenticating product:", error);
    return res.status(500).json({ error: "Failed to authenticate product" });
  }
});

export default ProductRouter;
