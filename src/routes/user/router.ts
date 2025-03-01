import { Router } from "express";
import prisma from "../../utils/db";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../../utils/auth";

const UserRouter = Router();

UserRouter.post("/register", async (req: any, res: any) => {
    const {
        name,
        email,
        password,
        phone
    } = req.body;   
    if(!name || !email || !password || !phone) return res.status(400).json({ error: "invalid input" });
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password,
            phone
        }
    }); 
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    return res.status(201).json({
        token
    });
});

UserRouter.post("/login", async (req: any, res: any) => {
    const {
        email,
        password
    } = req.body;
    if(!email || !password) return res.status(400).json({ error: "invalid input" });
    const user = await prisma.user.findUnique({
        where: {
            email,
       }
    });
    if(!user) return res.status(404).json({ error: "user not found" });
    if(user.password !== password) return res.status(401).json({ error: "invalid password" });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    return res.status(200).json({
        token
    });
}); 

UserRouter.get("/profile", authMiddleware, async (req: any, res: any) => {
    const user = await prisma.user.findUnique({
        where: {
            id: req.user.id
        }
    });
    if(!user) return res.status(404).json({ error: "user not found" });
    return res.status(200).json(user);
});


export default UserRouter;  