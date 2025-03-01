import { Router } from "express";
import prisma from "../../utils/db";
import { Account } from "@aptos-labs/ts-sdk";
import { aptosService } from "../../utils/aptosConfig";
import { authMiddleware } from "../../utils/auth";
import jwt from "jsonwebtoken";
import { EditionStatus } from "@prisma/client";
const BrandRouter = Router();

BrandRouter.post('/on-board', async (req: any, res: any) => {
    const {
        brand_name,
        brand_logo,
        brand_description,
        contact_email,
        contact_phone,
        website_url,
        social_links,
        location
    } = req.body;

    if (!brand_name || !brand_logo || !contact_email) {
        return res.status(400).json({ error: "invalid input" });
    }

    let brand = await prisma.brand.findFirst({
        where: { brand_name: brand_name }
    });

    if (brand) return res.status(400).json({ message: "brand already onboard" });

    const aptos = await aptosService.getAptos();
    const blockchain_account: Account = Account.generate();
    const walletAddress = blockchain_account.accountAddress.toString();

    await aptos.fundAccount({
        accountAddress: blockchain_account.accountAddress,
        amount: 100,
    });

    brand = await prisma.brand.create({
        data: {
            brand_name,
            brand_logo,
            brand_description,
            contact_email,
            contact_phone,
            website_url,
            social_links,
            location,
            blockchain_address: walletAddress,
            private_key: "private key",
            created_at: new Date(),
        }
    });

    const token = jwt.sign(
        { brand_id: brand.id, brand_name: brand.brand_name },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
    );

    return res.status(201).json({ 
        message: "Brand onboarded successfully", 
        token,
        brand
    });
});

BrandRouter.post("/add-edition" , authMiddleware, async (req: any, res: any) => {
    if(!req.user || !req.user.brand_name) return res.status(401).json({ error: "Unauthorized" });
    const {
        edition_title,
        edition_description,
        product_title,
        product_specification,
        product_colors,
        product_quantity
    } = req.body;

    if(!edition_title || !edition_description || !product_title || !product_specification || !product_colors || !product_quantity) return res.status(400).json({ error: "invalid input" });
  
    const brand = await prisma.brand.findFirst({
        where: {
            brand_name: req.user.brand_name
        }
    });

    if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
    }

    const edition = await prisma.edition.create({
        data: {
            title: edition_title,
            description: edition_description,
            brandId: brand.id,
            quantity: product_quantity,
            colors: product_colors,
            products: {
                create: {
                    title: product_title,
                    specification: product_specification,
                    color: product_colors[Math.floor(Math.random() * product_colors.length)],
                    brandId: brand.id,
                    ownerId: brand.id
                }
            }
        }
    });

    // Define the entry function payload
    const entryFunctionPayload: any = {
        function: "0x1::product::store_product",
        type_arguments: [],
        arguments: [
            product_title,
            product_specification,
        ]
    };

    try {
        // const aptos = await aptosService.getAptos();
        
        // // Use the updated API methods
        // const txn = await aptos.transaction.build.simple({
        //     sender: brand.blockchain_address,
        //     data: {
        //         function: '0x1::coin::transfer',
        //         typeArguments: [],
        //         functionArguments: [brand.blockchain_address, product_title],
        //     }
        // });
        // const brand_account = Account.generate()
        // const committedTxn = await aptos.signAndSubmitTransaction({ signer: brand_account , transaction: txn });

        // await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        // return res.status(201).json({ message: "Editions Created", txHash: committedTxn.hash });
        return res.status(201).json(edition);
    } catch (error) {
        console.error("Transaction error:", error);
        return res.status(500).json({ error: "Failed to create edition on blockchain" });
    }
});

BrandRouter.get("/get-editions" , authMiddleware, async (req: any, res: any) => {
    if(!req.user || !req.user.brand_name) return res.status(401).json({ error: "Unauthorized" });
    const brand = await prisma.brand.findUnique({    
        where: {
            brand_name: req.user.brand_name
        }
    });
    if(!brand) return res.status(404).json({ error: "Brand not found" });
    let status = req.query.status || "";
    if(status && status !== "active" && status !== "inactive") status = "";
    const editions = await prisma.edition.findMany({
        where: {
            brandId: brand.id,
            status: status as EditionStatus
        }
    }); 
    return res.status(200).json(editions);
});

BrandRouter.get("/get-edition/:id" , authMiddleware, async (req: any, res: any) => {
    if(!req.user || !req.user.brand_name) return res.status(401).json({ error: "Unauthorized" });
    
    const edition = await prisma.edition.findUnique({
        where: {
            id: req.params.id
        }
    });
    if(!edition) return res.status(404).json({ error: "Edition not found" });
    return res.status(200).json(edition);   
});

//update edition status
BrandRouter.put("/update-edition-status/:id" , authMiddleware, async (req: any, res: any) => {
    if(!req.user || !req.user.brand_name) return res.status(401).json({ error: "Unauthorized" });
    const {
        status
    } = req.body;
    if(!status || (status!=EditionStatus.active && status!=EditionStatus.inactive)) return res.status(400).json({ error: "invalid status" });
    const edition = await prisma.edition.update({
        where: {
            id: req.params.id   
        },
        data: {
            status: status as EditionStatus 
        }   
    }); 
    return res.status(200).json(edition);
});

export default BrandRouter;