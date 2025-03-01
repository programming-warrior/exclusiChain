import { Router } from "express";
import { authMiddleware } from "../../utils/auth";
import prisma from "../../utils/db";
import RedisClientSingleton from "../../utils/redis";

const ProductRouter = Router();

ProductRouter.put("/transfer-ownership/:id",  async (req: any, res: any) => {
    const redisClient = await RedisClientSingleton.getRedisClient();
    // if(!req.user || !req.user.id) return res.status(401).json({ error: "Unauthorized" });

    const user_id = req?.user?.id || "8d833252-b669-4d33-ba7c-c86e84e32014";

    const {
        id
    } = req.params;
  
    if(!user_id) return res.status(400).json({ error: "invalid input" });
    const product = await prisma.product.findUnique({
        where: {
            id  
        }
    });
    if(!product) return res.status(404).json({ error: "product not found" });
    const user = await prisma.user.findUnique({
        where: {
            id: user_id
        }
    });
    if(!user) return res.status(404).json({ error: "user not found" });

    await redisClient.lPush(
        'NOTIFICATION_QUEUE',
        JSON.stringify({
        //   receiver_id: product.ownerId,
          event: "PRODUCT_TRANSFER_REQUEST",
          data: {
            sender_id: user_id,
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


ProductRouter.get("/authenticate-product", async (req: any, res: any) => {
    const {
        product_id,
        brand_id,
        phone,
        email,
    } = req.body;
    if(!product_id) return res.status(400).json({ error: "invalid input" });

    const product = await prisma.product.findUnique({
        where: {
            id: product_id
        },
        include: {
            brand: true,
            owner: true,
        }
    });

    if(!product) return res.status(404).json({ error: "product not found" });

    const owner = {
      id: product.owner ? product.owner.id : product.brand.id,
      name: product.owner ? product.owner.name : product.brand.brand_name,
      email: product.owner ? product.owner.email : product.brand.contact_email,
      phone: product.owner ? product.owner.phone : product.brand.contact_phone,
    };
    
    return res.status(200).json(owner);
});


export default ProductRouter;   
