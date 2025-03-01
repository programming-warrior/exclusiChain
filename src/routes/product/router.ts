import { Router } from "express";
import { authMiddleware } from "../../utils/auth";
import prisma from "../../utils/db";
import RedisClientSingleton from "../../utils/redis";

const ProductRouter = Router();

ProductRouter.put("/transfer-ownership/:id", authMiddleware, async (req: any, res: any) => {
    const redisClient = await RedisClientSingleton.getRedisClient();
    if(!req.user || !req.user.id) return res.status(401).json({ error: "Unauthorized" });
    const {
        id
    } = req.params;
  
    if(!req.user.id) return res.status(400).json({ error: "invalid input" });
    const product = await prisma.product.findUnique({
        where: {
            id  
        }
    });
    if(!product) return res.status(404).json({ error: "product not found" });
    const user = await prisma.user.findUnique({
        where: {
            id: req.user.id
        }
    });
    if(!user) return res.status(404).json({ error: "user not found" });

    await redisClient.lPush(
        'NOTIFICATION_QUEUE',
        JSON.stringify({
          receiver_id: product.ownerId,
          event: "PRODUCT_TRANSFER_REQUEST",
          data: {
            sender_id: user.id,
            product_id: product.id,
            message: "user " + user.name + " has requested to transfer the product " + product.title + " to you"
          }
       }),
      )
    // const txHash = await aptosService.transfer(product.ownerId, user.id, product.id);

    return res.status(200).json({
        message: "product transfer request send",
        txHash: "txHash"
    });
});


export default ProductRouter;   
