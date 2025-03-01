-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL,
    "brand_logo" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Edition_pkey" PRIMARY KEY ("id")
);
