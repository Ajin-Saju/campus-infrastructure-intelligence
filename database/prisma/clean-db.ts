import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAllDatabaseTables() {
  console.log('🧹 Clearing all records from database tables...');

  try {
    // Delete in order of dependencies (child tables first)
    const deletedPredictions = await prisma.aIPrediction.deleteMany();
    console.log(`- Deleted ${deletedPredictions.count} records from AIPrediction`);

    const deletedUpdates = await prisma.maintenanceUpdate.deleteMany();
    console.log(`- Deleted ${deletedUpdates.count} records from MaintenanceUpdate`);

    const deletedVendorAssignments = await prisma.vendorAssignment.deleteMany();
    console.log(`- Deleted ${deletedVendorAssignments.count} records from VendorAssignment`);

    const deletedRepairHistories = await prisma.repairHistory.deleteMany();
    console.log(`- Deleted ${deletedRepairHistories.count} records from RepairHistory`);

    const deletedAttachments = await prisma.attachment.deleteMany();
    console.log(`- Deleted ${deletedAttachments.count} records from Attachment`);

    const deletedComments = await prisma.issueComment.deleteMany();
    console.log(`- Deleted ${deletedComments.count} records from IssueComment`);

    const deletedIssueImages = await prisma.issueImage.deleteMany();
    console.log(`- Deleted ${deletedIssueImages.count} records from IssueImage`);

    const deletedTasks = await prisma.maintenanceTask.deleteMany();
    console.log(`- Deleted ${deletedTasks.count} records from MaintenanceTask`);

    const deletedIssues = await prisma.issueReport.deleteMany();
    console.log(`- Deleted ${deletedIssues.count} records from IssueReport`);

    const deletedIssueCategories = await prisma.issueCategory.deleteMany();
    console.log(`- Deleted ${deletedIssueCategories.count} records from IssueCategory`);

    const deletedAssetQRCodes = await prisma.assetQRCode.deleteMany();
    console.log(`- Deleted ${deletedAssetQRCodes.count} records from AssetQRCode`);

    const deletedAssetImages = await prisma.assetImage.deleteMany();
    console.log(`- Deleted ${deletedAssetImages.count} records from AssetImage`);

    const deletedAssets = await prisma.asset.deleteMany();
    console.log(`- Deleted ${deletedAssets.count} records from Asset`);

    const deletedAssetCategories = await prisma.assetCategory.deleteMany();
    console.log(`- Deleted ${deletedAssetCategories.count} records from AssetCategory`);

    const deletedRoomQRCodes = await prisma.roomQRCode.deleteMany();
    console.log(`- Deleted ${deletedRoomQRCodes.count} records from RoomQRCode`);

    const deletedRooms = await prisma.room.deleteMany();
    console.log(`- Deleted ${deletedRooms.count} records from Room`);

    const deletedFloors = await prisma.floor.deleteMany();
    console.log(`- Deleted ${deletedFloors.count} records from Floor`);

    const deletedBuildings = await prisma.building.deleteMany();
    console.log(`- Deleted ${deletedBuildings.count} records from Building`);

    const deletedDepartments = await prisma.department.deleteMany();
    console.log(`- Deleted ${deletedDepartments.count} records from Department`);

    const deletedNotifications = await prisma.notification.deleteMany();
    console.log(`- Deleted ${deletedNotifications.count} records from Notification`);

    const deletedActivityLogs = await prisma.activityLog.deleteMany();
    console.log(`- Deleted ${deletedActivityLogs.count} records from ActivityLog`);

    console.log('\n✨ All database tables cleared successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllDatabaseTables();
