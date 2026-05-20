-- DropForeignKey
ALTER TABLE "Reagent" DROP CONSTRAINT "Reagent_nodeId_fkey";

-- AddForeignKey
ALTER TABLE "Reagent" ADD CONSTRAINT "Reagent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reagent" ADD CONSTRAINT "Reagent_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
