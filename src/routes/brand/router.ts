import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../../utils/auth";
import jwt from "jsonwebtoken";
import { EditionStatus, ProductStatus } from "@prisma/client";
const prisma = new PrismaClient();
const BrandRouter = Router();

BrandRouter.post("/on-board", async (req: any, res: any) => {
  try {
    const {
      brand_name,
      brand_logo,
      brand_description,
      contact_email,
      contact_phone,
      website_url,
      social_links,
      location,
    } = req.body;

    if (!brand_name || !brand_logo || !contact_email) {
      return res.status(400).json({ error: "invalid input" });
    }

    let brand = await prisma.brand.findFirst({
      where: { brand_name: brand_name },
    });
    console.log(brand);

    if (brand)
      return res.status(400).json({ message: "brand already onboard" });
    console.log(social_links);
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
        blockchain_address: "wallet address",
        private_key: "private key",
        created_at: new Date(),
      },
    });

    const token = jwt.sign(
      { brand_id: brand.id, brand_name: brand.brand_name },
      process.env.SECRET_KEY!,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Brand onboarded successfully",
      token,
      brand,
    });
  } catch (error) {
    console.error("Error onboarding brand:", error);
    return res.status(500).json({ error: "Failed to onboard brand" });
  }
});

function generate4DigitNumber() {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return randomNumber;
}
BrandRouter.get('/dashboard', async (req: any, res: any) => {
  const brand_name = req.query.brand_name 
  if (!brand_name) return res.status(400).json({ error: "invalid input" });
  const brand = await prisma.brand.findUnique({
    where: { brand_name: brand_name },
  });
  if (!brand) return res.status(404).json({ error: "Brand not found" });
  const editions = await prisma.edition.findMany({
    where: { brandId: brand.id },
  });
  const products = await prisma.product.findMany({
    where: { brandId: brand.id },
  });
  const total_inventory = products.filter((product) => product.status === ProductStatus.unsold).length;
  const total_sale = products.filter((product) => product.status === ProductStatus.sold).length;
  return res.status(200).json({total_skus: editions.length , total_inventory, total_sale });
});


BrandRouter.post("/add-edition", async (req: any, res: any) => {
  // if (!req.user || !req.user.brand_name)
  //   return res.status(401).json({ error: "Unauthorized" });
  const {
    edition_title,
    edition_description,
    product_title,
    product_specification,
    product_colors,
    product_quantity,
    brand_name,
  } = req.body;

  if (
    !edition_title ||
    !edition_description ||
    !product_title ||
    !product_specification ||
    !product_colors ||
    !product_quantity
  )
    return res.status(400).json({ error: "invalid input" });

  try {
    const brand = await prisma.brand.findFirst({
      where: {
        brand_name: brand_name,
      },
    });

    console.log(brand);

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
      },
    });

    


    for (let i = 0; i < product_quantity; i++) {
      await prisma.product.create({
        data: {
          id: brand_name.toUpperCase() + '-' + generate4DigitNumber(),
          title: product_title,
          specification: product_specification,
          color:
          product_colors[Math.floor(Math.random() * product_colors.length)],
          edition_id: edition.id,
          brandId: brand.id,
        },
      });
    }

    return res.status(201).json(edition);
  } catch (error) {
    console.error("Error adding edition:", error);
    return res.status(500).json({ error: "Failed to add edition" });
  }
});

BrandRouter.get("/get-editions", async (req: any, res: any) => {
  // if (!req.user || !req.user.brand_name)
  //   return res.status(401).json({ error: "Unauthorized" });
  const brand_name = req.query.brand_name || "";
  if (!brand_name) return res.status(400).json({ error: "invalid input" });
  const brand = await prisma.brand.findUnique({
    where: {
      brand_name: brand_name,
    },
  });
  if (!brand) return res.status(404).json({ error: "Brand not found" });
  let status = req.query.status || "";
  if (status && status !== "active" && status !== "inactive") status = "";
  const editions = await prisma.edition.findMany({
    where: {
      brandId: brand.id,
      status: status as EditionStatus,
    },
  });
  return res.status(200).json(editions);
});

BrandRouter.get("/get-edition/:id", async (req: any, res: any) => {
  // if (!req.user || !req.user.brand_name)
  //   return res.status(401).json({ error: "Unauthorized" });

  const edition = await prisma.edition.findUnique({
    where: {
      id: req.params.id,
    },
  });
  if (!edition) return res.status(404).json({ error: "Edition not found" });
  return res.status(200).json(edition);
});

//update edition status
BrandRouter.put(
  "/update-edition-status/:id",
  authMiddleware,
  async (req: any, res: any) => {
    if (!req.user || !req.user.brand_name)
      return res.status(401).json({ error: "Unauthorized" });
    const { status } = req.body;
    if (
      !status ||
      (status != EditionStatus.active && status != EditionStatus.inactive)
    )
      return res.status(400).json({ error: "invalid status" });
    const edition = await prisma.edition.update({
      where: {
        id: req.params.id,
      },
      data: {
        status: status as EditionStatus,
      },
    });
    return res.status(200).json(edition);
  }
);

export default BrandRouter;
