import { Prisma, PrismaClient, VendorAssignmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedVendorData() {
  console.log('🌱 Starting Vendor Management Seeding...');

  // 1. Ensure Admin User exists for assignedById
  let adminUser = await prisma.user.findFirst({ where: { email: 'admin@gmail.com', deletedAt: null } });
  if (!adminUser) {
    let role = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    if (!role) {
      role = await prisma.role.create({ data: { name: 'ADMIN', description: 'System Administrator' } });
    }
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
        firstName: 'Admin',
        lastName: 'User',
        roleId: role.id,
      },
    });
  }

  // 2. Vendors Data
  const vendorDefs = [
    { companyName: 'Apex HVAC & Refrigeration Solutions', contactName: 'Robert Vance', email: 'service@apexhvac.com', phone: '+1-555-0811', address: '100 Industrial Parkway, North Campus', taxId: 'TAX-HVAC-9012', rating: 4.9, serviceTypes: ['HVAC', 'AC', 'Refrigeration'] },
    { companyName: 'Precision CyberNet Services', contactName: 'Elena Rostova', email: 'support@cybernet.io', phone: '+1-555-0922', address: '404 Network Way, Silicon District', taxId: 'TAX-NET-4411', rating: 4.8, serviceTypes: ['Networking', 'Fiber Optics', 'Switches'] },
    { companyName: 'ElectroServe Infrastructure Labs', contactName: 'Marcus Wright', email: 'contact@electroserve.net', phone: '+1-555-0733', address: '77 Power Avenue, Tech City', taxId: 'TAX-ELEC-3388', rating: 4.7, serviceTypes: ['Electrical', 'UPS', 'Generators'] },
    { companyName: 'VisionTech Security & CCTV Ltd', contactName: 'Sarah Lin', email: 'info@visiontechcctv.com', phone: '+1-555-0644', address: '12 Surveillance Road, South Campus', taxId: 'TAX-CCTV-5522', rating: 4.9, serviceTypes: ['CCTV', 'Security', 'Surveillance'] },
    { companyName: 'Optima Lab & Scientific Instrument Repair', contactName: 'Dr. Alan Grant', email: 'repair@optimalabs.org', phone: '+1-555-0555', address: '88 Science Boulevard, Innovation Hub', taxId: 'TAX-LAB-7711', rating: 4.6, serviceTypes: ['Laboratory Equipment', 'Oscilloscopes', 'Calibration'] },
  ];

  const vendorMap: Record<string, any> = {};
  for (const v of vendorDefs) {
    let vendor = await prisma.vendor.findFirst({ where: { email: v.email, deletedAt: null } });
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          companyName: v.companyName,
          contactName: v.contactName,
          email: v.email,
          phone: v.phone,
          address: v.address,
          taxId: v.taxId,
          rating: v.rating,
          serviceTypes: v.serviceTypes,
        },
      });
    }
    vendorMap[v.companyName] = vendor;
  }
  console.log(`- Seeded ${Object.keys(vendorMap).length} Registered Vendors`);

  // 3. Maintenance Tasks for Assignment
  const tasks = await prisma.maintenanceTask.findMany({ where: { deletedAt: null }, take: 10 });
  if (tasks.length === 0) {
    console.log('⚠️ No maintenance tasks found to assign vendors. Please run main seed first.');
    return;
  }

  // 4. Vendor Assignments Data
  const assignmentDefs = [
    {
      vName: 'Apex HVAC & Refrigeration Solutions',
      taskIndex: 3, // AC not cooling
      status: VendorAssignmentStatus.IN_PROGRESS,
      contract: 1250.0,
      notes: 'Contractor assigned for compressor overhaul and coolant recharge.',
      qAmount: 1250.0,
      qNotes: 'Diagnostic report & original Daikin spare compressor included.',
      images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600'],
    },
    {
      vName: 'Precision CyberNet Services',
      taskIndex: 2, // Network connection unstable
      status: VendorAssignmentStatus.QUOTATION_SUBMITTED,
      contract: 2800.0,
      notes: 'High priority network switch module replacement quotation.',
      qAmount: 2800.0,
      qNotes: 'Cisco Catalyst 9200 replacement line card + 24hr emergency SLA.',
    },
    {
      vName: 'ElectroServe Infrastructure Labs',
      taskIndex: 6, // UPS battery warning
      status: VendorAssignmentStatus.COMPLETED,
      contract: 7500.0,
      notes: 'Server room APC Smart UPS battery bank replacement.',
      qAmount: 7500.0,
      cNotes: 'Replaced complete lead-acid battery cartridge pack. Tested on load for 2 hours.',
      invNum: 'INV-2026-8812',
      invAmount: 7500.0,
      pStatus: 'PAID',
    },
    {
      vName: 'VisionTech Security & CCTV Ltd',
      taskIndex: 5, // CCTV camera offline
      status: VendorAssignmentStatus.INVOICED,
      contract: 1800.0,
      notes: 'Entrance camera PoE power module & lens cleaning.',
      qAmount: 1800.0,
      cNotes: 'PoE power module replaced. Live video feed restored to NVR console.',
      invNum: 'INV-2026-9901',
      invAmount: 1800.0,
      pStatus: 'APPROVED',
    },
    {
      vName: 'Optima Lab & Scientific Instrument Repair',
      taskIndex: 7, // Oscilloscope display blank
      status: VendorAssignmentStatus.COMPLETED,
      contract: 1850.0,
      notes: 'Keysight oscilloscope display panel replacement & recalibration.',
      qAmount: 1850.0,
      cNotes: 'New LCD panel installed. Recalibrated all 4 channels.',
      invNum: 'INV-2026-1044',
      invAmount: 1850.0,
      pStatus: 'PAID',
    },
  ];

  let assignCount = 0;
  for (const a of assignmentDefs) {
    const vendor = vendorMap[a.vName];
    const task = tasks[a.taskIndex % tasks.length];

    if (vendor && task) {
      let existing = await prisma.vendorAssignment.findFirst({
        where: { vendorId: vendor.id, taskId: task.id, deletedAt: null },
      });

      if (!existing) {
        await prisma.vendorAssignment.create({
          data: {
            vendorId: vendor.id,
            taskId: task.id,
            assignedById: adminUser.id,
            status: a.status,
            contractAmount: a.contract,
            notes: a.notes,
            quotationAmount: a.qAmount,
            quotationUrl: 'https://example.com/quotation-document.pdf',
            quotationNotes: a.qNotes || null,
            quotationSubmittedAt: a.qAmount ? new Date('2026-08-02') : null,
            repairImageUrls: a.images ? (a.images as Prisma.InputJsonValue) : Prisma.JsonNull,
            completionReportUrl: a.cNotes ? 'https://example.com/completion-report.pdf' : null,
            completionNotes: a.cNotes || null,
            completedAt: a.cNotes ? new Date('2026-08-06') : null,
            invoiceNumber: a.invNum || null,
            invoiceAmount: a.invAmount || null,
            invoiceUrl: a.invNum ? 'https://example.com/invoice-doc.pdf' : null,
            invoicedAt: a.invNum ? new Date('2026-08-07') : null,
            paymentStatus: a.pStatus || 'PENDING',
          },
        });
        assignCount++;
      }
    }
  }

  console.log(`- Seeded ${assignCount} Vendor Task Assignments (Quotations, Reports, Invoices attached)`);
  console.log('🎉 Vendor Management Seeding Complete!');
}

seedVendorData()
  .catch((e) => {
    console.error('❌ Vendor Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
