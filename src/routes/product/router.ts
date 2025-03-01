import { Router } from "express";
import { authMiddleware } from "../../utils/auth";
import prisma from "../../utils/db";

const ProductRouter = Router();

ProductRouter.put("/transfer-ownership/:id", authMiddleware, async (req: any, res: any) => {
    const {
        id
    } = req.params;
    
    const {
        user_id
    } = req.body;

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
    const txHash = await aptosService.transfer(product.ownerId, user.id, product.id);
    return res.status(200).json({
        message: "product bought successfully",
        txHash
    });
});


export default ProductRouter;   
