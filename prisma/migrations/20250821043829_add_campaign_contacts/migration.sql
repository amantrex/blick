-- DropIndex
DROP INDEX "public"."Template_tenantId_name_key";

-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "estimatedRecipients" INTEGER;

-- CreateTable
CREATE TABLE "public"."CampaignContact" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignContact_campaignId_contactId_key" ON "public"."CampaignContact"("campaignId", "contactId");

-- AddForeignKey
ALTER TABLE "public"."CampaignContact" ADD CONSTRAINT "CampaignContact_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CampaignContact" ADD CONSTRAINT "CampaignContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
