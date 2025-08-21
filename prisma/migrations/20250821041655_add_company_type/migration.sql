-- CreateEnum
CREATE TYPE "public"."CompanyType" AS ENUM ('SCHOOL', 'CLINIC', 'HOSPITAL', 'COLLEGE', 'UNIVERSITY', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "companyType" "public"."CompanyType" NOT NULL DEFAULT 'SCHOOL';
