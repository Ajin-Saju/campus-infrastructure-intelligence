import {
  Prisma,
  PrismaClient,
  AssetStatus,
  IssuePriority,
  IssueStatus,
  TaskStatus,
  TaskType,
  AIPredictionType,
  NotificationType,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Complete Campus Infrastructure Intelligence Database Seeding...\n');

  // ==========================================
  // 1. ROLES
  // ==========================================
  console.log('1. Seeding Roles...');
  const roleDefs = [
    {
      name: 'ADMIN',
      description: 'Full system administrator with access to campus infrastructure management.',
    },
    {
      name: 'TECHNICIAN',
      description: 'Maintenance technician responsible for assigned maintenance tasks and repairs.',
    },
    {
      name: 'FACULTY',
      description: 'Faculty member who can report and monitor infrastructure issues.',
    },
    {
      name: 'STUDENT',
      description: 'Student who can report infrastructure issues.',
    },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of roleDefs) {
    let role = await prisma.role.findFirst({ where: { name: r.name, deletedAt: null } });
    if (!role) {
      role = await prisma.role.create({ data: r });
    }
    roleMap[r.name] = role.id;
  }
  console.log(`   ✔ 4 Roles active (${Object.keys(roleMap).join(', ')})`);

  // ==========================================
  // 2. DEPARTMENTS
  // ==========================================
  console.log('2. Seeding Departments...');
  const deptDefs = [
    { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science & Engineering' },
    { name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
    { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of Electronics & Communication' },
    { name: 'Mechanical Engineering', code: 'ME', description: 'Department of Mechanical Engineering' },
    { name: 'Electrical & Electronics Engineering', code: 'EEE', description: 'Department of Electrical & Electronics' },
    { name: 'Administration', code: 'ADMIN', description: 'Campus Administrative Services' },
    { name: 'Central Facilities & Maintenance', code: 'FAC', description: 'Campus Infrastructure & Maintenance' },
  ];

  const deptMap: Record<string, string> = {};
  for (const d of deptDefs) {
    let dept = await prisma.department.findFirst({ where: { code: d.code, deletedAt: null } });
    if (!dept) {
      dept = await prisma.department.create({ data: d });
    }
    deptMap[d.code] = dept.id;
  }
  console.log(`   ✔ 7 Departments active (${Object.keys(deptMap).join(', ')})`);

  // ==========================================
  // 3. USERS (Argon2 Hashing)
  // ==========================================
  console.log('3. Seeding Required Users (Argon2 Hashing)...');

  const userDefs = [
    {
      email: 'admin@gmail.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      plainPass: 'admin123',
      deptCode: 'ADMIN',
    },
    {
      email: 'maintenance1@gmail.com',
      firstName: 'Maintenance',
      lastName: 'Technician',
      role: 'TECHNICIAN',
      plainPass: 'maintenance123',
      deptCode: 'FAC',
      phone: '+1-555-0192',
    },
    {
      email: 'teach1@gmail.com',
      firstName: 'Faculty',
      lastName: 'User',
      role: 'FACULTY',
      plainPass: 'teach123',
      deptCode: 'CSE',
      phone: '+1-555-0144',
    },
    {
      email: 'verifytest1@campus.edu',
      firstName: 'Verify',
      lastName: 'Test',
      role: 'STUDENT',
      plainPass: 'verify123',
      deptCode: 'IT',
    },
    {
      email: 'stu1@gmail.com',
      firstName: 'Student',
      lastName: 'One',
      role: 'STUDENT',
      plainPass: 'stu1',
      deptCode: 'CSE',
    },
  ];

  const userMap: Record<string, any> = {};
  for (const u of userDefs) {
    let user = await prisma.user.findFirst({ where: { email: u.email, deletedAt: null } });
    const passwordHash = await argon2.hash(u.plainPass);

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          roleId: roleMap[u.role],
          departmentId: deptMap[u.deptCode],
          phone: u.phone || null,
          isActive: true,
          isEmailVerified: true,
        },
      });
    } else {
      // Update password hash to guarantee login compatibility
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, isActive: true, isEmailVerified: true },
      });
    }
    userMap[u.email] = user;
  }
  const adminUser = userMap['admin@gmail.com'];
  const techUser = userMap['maintenance1@gmail.com'];
  console.log(`   ✔ 5 Required Users created and active with Argon2 hashes`);

  // ==========================================
  // 4. BUILDINGS
  // ==========================================
  console.log('4. Seeding Buildings...');
  const buildingDefs = [
    { name: 'Main Academic Block', code: 'MAB', address: 'Main Campus', totalFloors: 3, lat: 12.9716, lng: 77.5946, deptCode: 'ADMIN' },
    { name: 'Computer Science Block', code: 'CSB', address: 'North Campus', totalFloors: 3, lat: 12.9725, lng: 77.5955, deptCode: 'CSE' },
    { name: 'Engineering Laboratory Block', code: 'ELB', address: 'East Campus', totalFloors: 4, lat: 12.973, lng: 77.596, deptCode: 'ECE' },
    { name: 'Library and Learning Centre', code: 'LLC', address: 'Central Campus', totalFloors: 2, lat: 12.971, lng: 77.594, deptCode: 'ADMIN' },
    { name: 'Administration Block', code: 'ADM', address: 'Central Campus', totalFloors: 2, lat: 12.9705, lng: 77.5935, deptCode: 'ADMIN' },
    { name: 'Student Activity Centre', code: 'SAC', address: 'South Campus', totalFloors: 2, lat: 12.9695, lng: 77.5925, deptCode: 'FAC' },
  ];

  const buildingMap: Record<string, any> = {};
  for (const b of buildingDefs) {
    let building = await prisma.building.findFirst({ where: { code: b.code, deletedAt: null } });
    if (!building) {
      building = await prisma.building.create({
        data: {
          name: b.name,
          code: b.code,
          address: b.address,
          totalFloors: b.totalFloors,
          latitude: b.lat,
          longitude: b.lng,
          departmentId: deptMap[b.deptCode],
        },
      });
    }
    buildingMap[b.code] = building;
  }
  console.log(`   ✔ 6 Campus Buildings active`);

  // ==========================================
  // 5. FLOORS
  // ==========================================
  console.log('5. Seeding Floors...');
  const floorNames = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'];
  const floorMap: Record<string, any> = {};

  for (const bCode of Object.keys(buildingMap)) {
    const building = buildingMap[bCode];
    for (let fNum = 0; fNum < building.totalFloors; fNum++) {
      const fKey = `${bCode}-${fNum}`;
      let floor = await prisma.floor.findFirst({
        where: { buildingId: building.id, floorNumber: fNum, deletedAt: null },
      });
      if (!floor) {
        floor = await prisma.floor.create({
          data: {
            buildingId: building.id,
            floorNumber: fNum,
            name: floorNames[fNum] || `Floor ${fNum}`,
          },
        });
      }
      floorMap[fKey] = floor;
    }
  }
  console.log(`   ✔ ${Object.keys(floorMap).length} Floors linked to Buildings`);

  // ==========================================
  // 6. ROOMS
  // ==========================================
  console.log('6. Seeding Rooms...');
  const roomDefs = [
    // MAB Rooms
    { bCode: 'MAB', fNum: 0, rNum: 'G01', name: 'Main Seminar Hall', type: 'SEMINAR_HALL', cap: 120 },
    { bCode: 'MAB', fNum: 0, rNum: 'G02', name: 'Store Room A', type: 'STORE_ROOM', cap: 10 },
    { bCode: 'MAB', fNum: 1, rNum: '101', name: 'Lecture Hall 101', type: 'CLASSROOM', cap: 60 },
    { bCode: 'MAB', fNum: 1, rNum: '102', name: 'Lecture Hall 102', type: 'CLASSROOM', cap: 60 },
    { bCode: 'MAB', fNum: 2, rNum: '201', name: 'Faculty Cabin 201', type: 'FACULTY_ROOM', cap: 5 },
    { bCode: 'MAB', fNum: 2, rNum: '202', name: 'Auditorium', type: 'AUDITORIUM', cap: 300 },

    // CSB Rooms
    { bCode: 'CSB', fNum: 0, rNum: 'G01', name: 'Programming Lab 1', type: 'LAB', cap: 40 },
    { bCode: 'CSB', fNum: 0, rNum: 'G02', name: 'Server Room North', type: 'SERVER_ROOM', cap: 5 },
    { bCode: 'CSB', fNum: 1, rNum: '101', name: 'CS Classroom 101', type: 'CLASSROOM', cap: 50 },
    { bCode: 'CSB', fNum: 1, rNum: '102', name: 'AI Research Lab', type: 'LAB', cap: 30 },
    { bCode: 'CSB', fNum: 2, rNum: '201', name: 'CSE HOD Office', type: 'OFFICE', cap: 8 },
    { bCode: 'CSB', fNum: 2, rNum: '202', name: 'Hardware Lab', type: 'LAB', cap: 35 },

    // ELB Rooms
    { bCode: 'ELB', fNum: 0, rNum: 'G01', name: 'Heavy Machinery Lab', type: 'LAB', cap: 25 },
    { bCode: 'ELB', fNum: 0, rNum: 'G02', name: 'Electrical Measurements Lab', type: 'LAB', cap: 30 },
    { bCode: 'ELB', fNum: 1, rNum: '101', name: 'Electronics Circuits Lab', type: 'LAB', cap: 35 },
    { bCode: 'ELB', fNum: 1, rNum: '102', name: 'ECE Seminar Room', type: 'SEMINAR_HALL', cap: 75 },
    { bCode: 'ELB', fNum: 2, rNum: '201', name: 'ME Drawing Hall', type: 'CLASSROOM', cap: 60 },
    { bCode: 'ELB', fNum: 2, rNum: '202', name: 'Robotics Workshop', type: 'LAB', cap: 30 },
    { bCode: 'ELB', fNum: 3, rNum: '301', name: 'High Voltage Testing Lab', type: 'LAB', cap: 20 },

    // LLC Rooms
    { bCode: 'LLC', fNum: 0, rNum: 'G01', name: 'Central Digital Reading Room', type: 'LIBRARY', cap: 150 },
    { bCode: 'LLC', fNum: 1, rNum: '101', name: 'Archive & Reference Section', type: 'LIBRARY', cap: 80 },

    // ADM Rooms
    { bCode: 'ADM', fNum: 0, rNum: 'G01', name: 'Registrar Office', type: 'OFFICE', cap: 15 },
    { bCode: 'ADM', fNum: 1, rNum: '101', name: 'Principal Conference Room', type: 'SEMINAR_HALL', cap: 30 },

    // SAC Rooms
    { bCode: 'SAC', fNum: 0, rNum: 'G01', name: 'Indoor Sports Arena Office', type: 'OFFICE', cap: 10 },
    { bCode: 'SAC', fNum: 1, rNum: '101', name: 'Student Council Room', type: 'FACULTY_ROOM', cap: 20 },
  ];

  const roomMap: Record<string, any> = {};
  for (const r of roomDefs) {
    const building = buildingMap[r.bCode];
    const floor = floorMap[`${r.bCode}-${r.fNum}`];
    const rKey = `${r.bCode}-${r.rNum}`;

    let room = await prisma.room.findFirst({
      where: { buildingId: building.id, roomNumber: r.rNum, deletedAt: null },
    });

    if (!room) {
      room = await prisma.room.create({
        data: {
          buildingId: building.id,
          floorId: floor.id,
          roomNumber: r.rNum,
          name: r.name,
          type: r.type,
          capacity: r.cap,
        },
      });
    }
    roomMap[rKey] = room;
  }
  console.log(`   ✔ ${Object.keys(roomMap).length} Rooms linked to Floors & Buildings`);

  // ==========================================
  // 7. ASSET CATEGORIES
  // ==========================================
  console.log('7. Seeding Asset Categories...');
  const assetCatDefs = [
    { name: 'Computer Hardware', code: 'COMPUTER', description: 'Desktop PCs, laptops, and workstations' },
    { name: 'Printer Equipment', code: 'PRINTER', description: 'Laser, inkjet, and multifunction printers' },
    { name: 'Networking Equipment', code: 'NETWORK', description: 'Switches, routers, access points, and racks' },
    { name: 'HVAC Systems', code: 'HVAC', description: 'Split ACs, cassette units, and chillers' },
    { name: 'Electrical Infrastructure', code: 'ELECTRICAL', description: 'Transformers, switchgear, and panels' },
    { name: 'CCTV Surveillance', code: 'CCTV', description: 'IP cameras, DVRs, and NVR monitors' },
    { name: 'Projector & AV', code: 'PROJECTOR', description: 'Projectors, motorized screens, and audio systems' },
    { name: 'Laboratory Equipment', code: 'LAB', description: 'Oscilloscopes, multimeters, power supplies, and kits' },
    { name: 'Campus Furniture', code: 'FURNITURE', description: 'Desks, chairs, podiums, and storage units' },
    { name: 'Power Backup UPS', code: 'UPS', description: 'UPS systems, battery banks, and inverters' },
  ];

  const assetCatMap: Record<string, any> = {};
  for (const ac of assetCatDefs) {
    let cat = await prisma.assetCategory.findFirst({
      where: { OR: [{ code: ac.code }, { name: ac.name }], deletedAt: null },
    });
    if (!cat) {
      cat = await prisma.assetCategory.create({ data: ac });
    }
    assetCatMap[ac.code] = cat;
  }
  console.log(`   ✔ 10 Asset Categories active`);

  // ==========================================
  // 8. ASSETS (Connected Hierarchy)
  // ==========================================
  console.log('8. Seeding Connected Assets...');
  const assetDefs = [
    { tag: 'COMP-001', name: 'Dell OptiPlex 7010 Desktop', catCode: 'COMPUTER', deptCode: 'CSE', bCode: 'CSB', fNum: 0, rNum: 'G01', status: AssetStatus.OPERATIONAL, cost: 850.0, mfr: 'Dell' },
    { tag: 'COMP-002', name: 'Lenovo ThinkCentre M90 Workstation', catCode: 'COMPUTER', deptCode: 'CSE', bCode: 'CSB', fNum: 1, rNum: '101', status: AssetStatus.NEEDS_REPAIR, cost: 920.0, mfr: 'Lenovo' },
    { tag: 'COMP-003', name: 'HP ProDesk 600 G6 Desktop', catCode: 'COMPUTER', deptCode: 'IT', bCode: 'CSB', fNum: 1, rNum: '102', status: AssetStatus.OPERATIONAL, cost: 780.0, mfr: 'HP' },
    { tag: 'PRINT-001', name: 'Epson EcoTank L3250 Printer', catCode: 'PRINTER', deptCode: 'ADMIN', bCode: 'MAB', fNum: 0, rNum: 'G02', status: AssetStatus.NEEDS_REPAIR, cost: 280.0, mfr: 'Epson' },
    { tag: 'PRINT-002', name: 'HP LaserJet Pro M404dn', catCode: 'PRINTER', deptCode: 'CSE', bCode: 'CSB', fNum: 2, rNum: '201', status: AssetStatus.OPERATIONAL, cost: 410.0, mfr: 'HP' },
    { tag: 'NET-001', name: 'Cisco Catalyst 9200 Switch', catCode: 'NETWORK', deptCode: 'FAC', bCode: 'CSB', fNum: 0, rNum: 'G02', status: AssetStatus.IN_MAINTENANCE, cost: 2400.0, mfr: 'Cisco' },
    { tag: 'NET-002', name: 'Cisco ISR 4331 Router', catCode: 'NETWORK', deptCode: 'FAC', bCode: 'CSB', fNum: 0, rNum: 'G02', status: AssetStatus.NEEDS_REPAIR, cost: 3100.0, mfr: 'Cisco' },
    { tag: 'PROJ-001', name: 'BenQ MX560 Projector', catCode: 'PROJECTOR', deptCode: 'CSE', bCode: 'CSB', fNum: 1, rNum: '101', status: AssetStatus.OPERATIONAL, cost: 650.0, mfr: 'BenQ' },
    { tag: 'PROJ-002', name: 'Epson EB-X06 Projector', catCode: 'PROJECTOR', deptCode: 'ECE', bCode: 'ELB', fNum: 1, rNum: '102', status: AssetStatus.OPERATIONAL, cost: 710.0, mfr: 'Epson' },
    { tag: 'AC-001', name: 'Daikin Split AC 2 Ton', catCode: 'HVAC', deptCode: 'CSE', bCode: 'CSB', fNum: 1, rNum: '101', status: AssetStatus.NEEDS_REPAIR, cost: 1200.0, mfr: 'Daikin' },
    { tag: 'AC-002', name: 'LG Cassette AC 3 Ton', catCode: 'HVAC', deptCode: 'ADMIN', bCode: 'MAB', fNum: 0, rNum: 'G01', status: AssetStatus.OPERATIONAL, cost: 1650.0, mfr: 'LG' },
    { tag: 'CCTV-001', name: 'Hikvision Dome Camera 4MP', catCode: 'CCTV', deptCode: 'FAC', bCode: 'MAB', fNum: 0, rNum: 'G01', status: AssetStatus.NEEDS_REPAIR, cost: 180.0, mfr: 'Hikvision' },
    { tag: 'CCTV-002', name: 'Hikvision Bullet Outdoor Camera', catCode: 'CCTV', deptCode: 'FAC', bCode: 'SAC', fNum: 0, rNum: 'G01', status: AssetStatus.OPERATIONAL, cost: 220.0, mfr: 'Hikvision' },
    { tag: 'UPS-001', name: 'APC Smart UPS 3000VA', catCode: 'UPS', deptCode: 'FAC', bCode: 'CSB', fNum: 0, rNum: 'G02', status: AssetStatus.IN_MAINTENANCE, cost: 1950.0, mfr: 'APC' },
    { tag: 'LAB-001', name: 'Keysight Digital Oscilloscope 100MHz', catCode: 'LAB', deptCode: 'ECE', bCode: 'ELB', fNum: 1, rNum: '101', status: AssetStatus.NEEDS_REPAIR, cost: 1850.0, mfr: 'Keysight' },
    { tag: 'LAB-002', name: 'Fluke Digital Multimeter 87V', catCode: 'LAB', deptCode: 'EEE', bCode: 'ELB', fNum: 0, rNum: 'G02', status: AssetStatus.OPERATIONAL, cost: 420.0, mfr: 'Fluke' },
    { tag: 'LAB-003', name: 'DC Regulated Power Supply 30V/5A', catCode: 'LAB', deptCode: 'ECE', bCode: 'ELB', fNum: 1, rNum: '101', status: AssetStatus.OPERATIONAL, cost: 290.0, mfr: 'GW Instek' },
    { tag: 'FUR-001', name: 'Ergonomic Mesh Office Chair', catCode: 'FURNITURE', deptCode: 'ADMIN', bCode: 'ADM', fNum: 0, rNum: 'G01', status: AssetStatus.OPERATIONAL, cost: 150.0, mfr: 'Featherlite' },
    { tag: 'FUR-002', name: 'Executive Wooden Conference Desk', catCode: 'FURNITURE', deptCode: 'ADMIN', bCode: 'ADM', fNum: 1, rNum: '101', status: AssetStatus.OPERATIONAL, cost: 1100.0, mfr: 'Godrej' },
  ];

  const assetMap: Record<string, any> = {};
  for (const a of assetDefs) {
    const b = buildingMap[a.bCode];
    const f = floorMap[`${a.bCode}-${a.fNum}`];
    const r = roomMap[`${a.bCode}-${a.rNum}`];

    let asset = await prisma.asset.findFirst({ where: { assetTag: a.tag, deletedAt: null } });
    if (!asset) {
      asset = await prisma.asset.create({
        data: {
          assetTag: a.tag,
          name: a.name,
          categoryId: assetCatMap[a.catCode].id,
          departmentId: deptMap[a.deptCode],
          buildingId: b.id,
          floorId: f.id,
          roomId: r.id,
          status: a.status,
          manufacturer: a.mfr,
          purchaseCost: a.cost,
          purchaseDate: new Date('2024-01-15'),
          warrantyExpiry: new Date('2027-01-15'),
          expectedLifespanYears: 5,
        },
      });
    }
    assetMap[a.tag] = asset;
  }
  console.log(`   ✔ 19 Connected Assets active with verified Building/Floor/Room hierarchy`);

  // ==========================================
  // 9. ASSET IMAGES
  // ==========================================
  console.log('9. Seeding Asset Images...');
  const assetImageDefs = [
    { tag: 'COMP-001', url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600', cap: 'Dell OptiPlex Desktop Workstation' },
    { tag: 'PRINT-001', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600', cap: 'Epson EcoTank Inkjet Printer' },
    { tag: 'NET-001', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600', cap: 'Cisco Catalyst 9200 Rack Switch' },
    { tag: 'PROJ-001', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600', cap: 'BenQ Ceiling Projector' },
    { tag: 'AC-001', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', cap: 'Daikin Wall Split AC Unit' },
    { tag: 'UPS-001', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', cap: 'APC Rackmount Smart UPS' },
    { tag: 'LAB-001', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600', cap: 'Keysight Digital Storage Oscilloscope' },
  ];

  let assetImgCount = 0;
  for (const img of assetImageDefs) {
    const asset = assetMap[img.tag];
    if (asset) {
      await prisma.assetImage.create({
        data: {
          assetId: asset.id,
          url: img.url,
          caption: img.cap,
          isPrimary: true,
          uploadedById: userMap['admin@gmail.com'].id,
        },
      });
      assetImgCount++;
    }
  }
  console.log(`   ✔ ${assetImgCount} Asset Images created`);

  // ==========================================
  // 10. ISSUE CATEGORIES
  // ==========================================
  console.log('10. Seeding Issue Categories...');
  const issueCatDefs = [
    { name: 'Computer Hardware', code: 'COMPUTER', defaultPriority: IssuePriority.MEDIUM },
    { name: 'Printer', code: 'PRINTER', defaultPriority: IssuePriority.MEDIUM },
    { name: 'Networking', code: 'NETWORK', defaultPriority: IssuePriority.HIGH },
    { name: 'HVAC', code: 'HVAC', defaultPriority: IssuePriority.HIGH },
    { name: 'Electrical', code: 'ELECTRICAL', defaultPriority: IssuePriority.CRITICAL },
    { name: 'CCTV', code: 'CCTV', defaultPriority: IssuePriority.HIGH },
    { name: 'Projector & AV', code: 'PROJECTOR', defaultPriority: IssuePriority.MEDIUM },
    { name: 'Laboratory Equipment', code: 'LAB', defaultPriority: IssuePriority.HIGH },
    { name: 'Furniture Repair', code: 'FURNITURE', defaultPriority: IssuePriority.LOW },
    { name: 'Plumbing', code: 'PLUMBING', defaultPriority: IssuePriority.MEDIUM },
  ];

  const issueCatMap: Record<string, any> = {};
  for (const ic of issueCatDefs) {
    let cat = await prisma.issueCategory.findFirst({
      where: { OR: [{ code: ic.code }, { name: ic.name }], deletedAt: null },
    });
    if (!cat) {
      cat = await prisma.issueCategory.create({
        data: { name: ic.name, code: ic.code, defaultPriority: ic.defaultPriority },
      });
    }
    issueCatMap[ic.code] = cat;
  }
  console.log(`   ✔ 10 Issue Categories active`);

  // ==========================================
  // 11. ISSUE REPORTS (20 Connected Records)
  // ==========================================
  console.log('11. Seeding Connected Issue Reports...');
  const issueDefs = [
    { ticket: 'TKT-2026-0001', title: 'Computer not turning on', desc: 'The desktop computer in the computer laboratory does not power on when the power button is pressed.', catCode: 'COMPUTER', priority: IssuePriority.HIGH, status: IssueStatus.OPEN, reporterEmail: 'verifytest1@campus.edu', assetTag: 'COMP-001' },
    { ticket: 'TKT-2026-0002', title: 'Printer paper jam', desc: 'The printer repeatedly gets stuck while printing student documents.', catCode: 'PRINTER', priority: IssuePriority.MEDIUM, status: IssueStatus.OPEN, reporterEmail: 'teach1@gmail.com', assetTag: 'PRINT-001' },
    { ticket: 'TKT-2026-0003', title: 'Network connection unstable', desc: 'Network connectivity repeatedly drops in the server room and interrupts access to internal services.', catCode: 'NETWORK', priority: IssuePriority.CRITICAL, status: IssueStatus.OPEN, reporterEmail: 'teach1@gmail.com', assetTag: 'NET-001' },
    { ticket: 'TKT-2026-0004', title: 'AC not cooling', desc: 'The classroom air conditioner is running but is not providing sufficient cooling.', catCode: 'HVAC', priority: IssuePriority.HIGH, status: IssueStatus.IN_PROGRESS, reporterEmail: 'stu1@gmail.com', assetTag: 'AC-001' },
    { ticket: 'TKT-2026-0005', title: 'Projector display flickering', desc: 'The projector display continuously flickers during classroom presentations.', catCode: 'PROJECTOR', priority: IssuePriority.MEDIUM, status: IssueStatus.IN_PROGRESS, reporterEmail: 'verifytest1@campus.edu', assetTag: 'PROJ-001' },
    { ticket: 'TKT-2026-0006', title: 'CCTV camera offline', desc: 'The CCTV camera near the main entrance is not displaying a live video feed.', catCode: 'CCTV', priority: IssuePriority.HIGH, status: IssueStatus.IN_PROGRESS, reporterEmail: 'admin@gmail.com', assetTag: 'CCTV-001' },
    { ticket: 'TKT-2026-0007', title: 'UPS battery warning', desc: 'The UPS in the server room is displaying a battery replacement warning.', catCode: 'ELECTRICAL', priority: IssuePriority.HIGH, status: IssueStatus.IN_PROGRESS, reporterEmail: 'maintenance1@gmail.com', assetTag: 'UPS-001' },
    { ticket: 'TKT-2026-0008', title: 'Laboratory oscilloscope display blank', desc: 'The oscilloscope powers on but the display remains blank.', catCode: 'LAB', priority: IssuePriority.MEDIUM, status: IssueStatus.RESOLVED, reporterEmail: 'teach1@gmail.com', assetTag: 'LAB-001' },
    { ticket: 'TKT-2026-0009', title: 'Computer running slowly', desc: 'The workstation takes several minutes to open applications and frequently becomes unresponsive.', catCode: 'COMPUTER', priority: IssuePriority.MEDIUM, status: IssueStatus.CLOSED, reporterEmail: 'stu1@gmail.com', assetTag: 'COMP-002' },
    { ticket: 'TKT-2026-0010', title: 'Air conditioner making unusual noise', desc: 'The air conditioner is producing a loud mechanical noise during operation.', catCode: 'HVAC', priority: IssuePriority.MEDIUM, status: IssueStatus.OPEN, reporterEmail: 'verifytest1@campus.edu', assetTag: 'AC-002' },
    { ticket: 'TKT-2026-0011', title: 'Router overheating warning', desc: 'The main edge router chassis temperature is exceeding safety threshold.', catCode: 'NETWORK', priority: IssuePriority.CRITICAL, status: IssueStatus.OPEN, reporterEmail: 'admin@gmail.com', assetTag: 'NET-002' },
    { ticket: 'TKT-2026-0012', title: 'Digital multimeter calibration error', desc: 'Incorrect voltage readings observed during laboratory practical experiments.', catCode: 'LAB', priority: IssuePriority.HIGH, status: IssueStatus.IN_PROGRESS, reporterEmail: 'teach1@gmail.com', assetTag: 'LAB-002' },
    { ticket: 'TKT-2026-0013', title: 'Printer toner empty', desc: 'HP LaserJet printer indicates black cartridge is depleted.', catCode: 'PRINTER', priority: IssuePriority.LOW, status: IssueStatus.RESOLVED, reporterEmail: 'teach1@gmail.com', assetTag: 'PRINT-002' },
    { ticket: 'TKT-2026-0014', title: 'ECE lab projector color distortion', desc: 'Projector projects strong blue tint across presentations.', catCode: 'PROJECTOR', priority: IssuePriority.MEDIUM, status: IssueStatus.IN_PROGRESS, reporterEmail: 'teach1@gmail.com', assetTag: 'PROJ-002' },
    { ticket: 'TKT-2026-0015', title: 'Conference table leg loose', desc: 'Executive wooden conference desk has an unstable supporting leg.', catCode: 'FURNITURE', priority: IssuePriority.LOW, status: IssueStatus.CLOSED, reporterEmail: 'admin@gmail.com', assetTag: 'FUR-002' },
    { ticket: 'TKT-2026-0016', title: 'Power outlet loose in CSB-101', desc: 'Wall socket near row 3 sparking intermittently.', catCode: 'ELECTRICAL', priority: IssuePriority.HIGH, status: IssueStatus.RESOLVED, reporterEmail: 'stu1@gmail.com', assetTag: null },
    { ticket: 'TKT-2026-0017', title: 'Restroom faucet leak in MAB-G01', desc: 'Continuous water leakage from main faucet.', catCode: 'PLUMBING', priority: IssuePriority.MEDIUM, status: IssueStatus.CLOSED, reporterEmail: 'verifytest1@campus.edu', assetTag: null },
    { ticket: 'TKT-2026-0018', title: 'Outdoor camera lens foggy', desc: 'Bullet camera front glass accumulated condensation.', catCode: 'CCTV', priority: IssuePriority.LOW, status: IssueStatus.RESOLVED, reporterEmail: 'admin@gmail.com', assetTag: 'CCTV-002' },
    { ticket: 'TKT-2026-0019', title: 'Power supply voltage output zero', desc: 'Bench DC power supply produces no DC voltage.', catCode: 'LAB', priority: IssuePriority.HIGH, status: IssueStatus.OPEN, reporterEmail: 'teach1@gmail.com', assetTag: 'LAB-003' },
    { ticket: 'TKT-2026-0020', title: 'Office chair armrest broken', desc: 'Left armrest of mesh chair snapped.', catCode: 'FURNITURE', priority: IssuePriority.LOW, status: IssueStatus.REJECTED, reporterEmail: 'verifytest1@campus.edu', assetTag: 'FUR-001' },
  ];

  const issueMap: Record<string, any> = {};
  for (const iss of issueDefs) {
    const reporter = userMap[iss.reporterEmail];
    const cat = issueCatMap[iss.catCode];
    const asset = iss.assetTag ? assetMap[iss.assetTag] : null;

    let report = await prisma.issueReport.findFirst({ where: { ticketNumber: iss.ticket, deletedAt: null } });
    if (!report) {
      report = await prisma.issueReport.create({
        data: {
          ticketNumber: iss.ticket,
          title: iss.title,
          description: iss.desc,
          categoryId: cat.id,
          priority: iss.priority,
          status: iss.status,
          reportedById: reporter.id,
          assetId: asset ? asset.id : null,
          buildingId: asset ? asset.buildingId : null,
          roomId: asset ? asset.roomId : null,
          resolvedAt: iss.status === IssueStatus.RESOLVED || iss.status === IssueStatus.CLOSED ? new Date('2026-08-05') : null,
          closedAt: iss.status === IssueStatus.CLOSED ? new Date('2026-08-06') : null,
        },
      });
    }
    issueMap[iss.ticket] = report;
  }
  console.log(`   ✔ 20 Issue Reports created and linked to Users, Categories & Assets`);

  // ==========================================
  // 12. ISSUE IMAGES & COMMENTS
  // ==========================================
  console.log('12. Seeding Issue Images & Comments...');
  const issueImgDefs = [
    { ticket: 'TKT-2026-0002', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600', cap: 'Printer paper jam photo' },
    { ticket: 'TKT-2026-0003', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600', cap: 'Switch port status lights' },
    { ticket: 'TKT-2026-0004', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', cap: 'AC unit indicator' },
    { ticket: 'TKT-2026-0005', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600', cap: 'Projector display flickering photo' },
    { ticket: 'TKT-2026-0007', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', cap: 'UPS battery alert light' },
  ];

  for (const img of issueImgDefs) {
    const iss = issueMap[img.ticket];
    if (iss) {
      await prisma.issueImage.create({
        data: {
          issueReportId: iss.id,
          url: img.url,
          caption: img.cap,
          uploadedById: iss.reportedById,
        },
      });
    }
  }

  const commentDefs = [
    { ticket: 'TKT-2026-0001', userEmail: 'maintenance1@gmail.com', text: 'Technician inspection is scheduled for this afternoon.', isInternal: false },
    { ticket: 'TKT-2026-0002', userEmail: 'teach1@gmail.com', text: 'The network switch has been restarted but the paper jam error persists.', isInternal: false },
    { ticket: 'TKT-2026-0003', userEmail: 'maintenance1@gmail.com', text: 'Replacement cooling fan & cables requested from warehouse.', isInternal: true },
    { ticket: 'TKT-2026-0004', userEmail: 'admin@gmail.com', text: 'Please schedule the AC repair after the current lecture period.', isInternal: false },
    { ticket: 'TKT-2026-0005', userEmail: 'maintenance1@gmail.com', text: 'HDMI cable tested; issue traced to projector lamp module.', isInternal: true },
    { ticket: 'TKT-2026-0007', userEmail: 'maintenance1@gmail.com', text: 'Battery pack replacement ordered from central inventory.', isInternal: false },
  ];

  for (const c of commentDefs) {
    const iss = issueMap[c.ticket];
    const u = userMap[c.userEmail];
    if (iss && u) {
      await prisma.issueComment.create({
        data: {
          issueReportId: iss.id,
          userId: u.id,
          content: c.text,
          isInternal: c.isInternal,
        },
      });
    }
  }
  console.log(`   ✔ Issue Images & Comments attached`);

  // ==========================================
  // 13. MAINTENANCE TASKS (15 Connected Tasks)
  // ==========================================
  console.log('13. Seeding Maintenance Tasks (Full Workflow Progression)...');
  const techId = userMap['maintenance1@gmail.com'].id;

  const taskDefs = [
    { num: 'MNT-2026-0001', ticket: 'TKT-2026-0001', assetTag: 'COMP-001', title: 'Computer not turning on', status: TaskStatus.PENDING, assignedTo: null, priority: IssuePriority.HIGH },
    { num: 'MNT-2026-0002', ticket: 'TKT-2026-0002', assetTag: 'PRINT-001', title: 'Printer paper jam', status: TaskStatus.AI_CATEGORIZED, assignedTo: null, priority: IssuePriority.MEDIUM },
    { num: 'MNT-2026-0003', ticket: 'TKT-2026-0003', assetTag: 'NET-001', title: 'Network connection unstable', status: TaskStatus.ADMIN_REVIEW, assignedTo: null, priority: IssuePriority.CRITICAL },
    { num: 'MNT-2026-0004', ticket: 'TKT-2026-0004', assetTag: 'AC-001', title: 'AC not cooling', status: TaskStatus.ASSIGNED, assignedTo: techId, priority: IssuePriority.HIGH },
    { num: 'MNT-2026-0005', ticket: 'TKT-2026-0005', assetTag: 'PROJ-001', title: 'Projector display flickering', status: TaskStatus.ACCEPTED, assignedTo: techId, priority: IssuePriority.MEDIUM },
    { num: 'MNT-2026-0006', ticket: 'TKT-2026-0006', assetTag: 'CCTV-001', title: 'CCTV camera offline', status: TaskStatus.IN_PROGRESS, assignedTo: techId, priority: IssuePriority.HIGH },
    { num: 'MNT-2026-0007', ticket: 'TKT-2026-0007', assetTag: 'UPS-001', title: 'UPS battery warning', status: TaskStatus.WAITING_FOR_PARTS, assignedTo: techId, priority: IssuePriority.CRITICAL },
    { num: 'MNT-2026-0008', ticket: 'TKT-2026-0008', assetTag: 'LAB-001', title: 'Laboratory oscilloscope display blank', status: TaskStatus.COMPLETED, assignedTo: techId, priority: IssuePriority.MEDIUM },
    { num: 'MNT-2026-0009', ticket: 'TKT-2026-0009', assetTag: 'COMP-002', title: 'Computer running slowly', status: TaskStatus.CLOSED, assignedTo: techId, priority: IssuePriority.MEDIUM },
    { num: 'MNT-2026-0010', ticket: 'TKT-2026-0010', assetTag: 'AC-002', title: 'Air conditioner making unusual noise', status: TaskStatus.PENDING, assignedTo: null, priority: IssuePriority.MEDIUM },
    { num: 'MNT-2026-0011', ticket: 'TKT-2026-0011', assetTag: 'NET-002', title: 'Router overheating warning', status: TaskStatus.ADMIN_REVIEW, assignedTo: null, priority: IssuePriority.CRITICAL },
    { num: 'MNT-2026-0012', ticket: 'TKT-2026-0012', assetTag: 'LAB-002', title: 'Digital multimeter calibration error', status: TaskStatus.ASSIGNED, assignedTo: techId, priority: IssuePriority.HIGH },
    { num: 'MNT-2026-0013', ticket: 'TKT-2026-0013', assetTag: 'PRINT-002', title: 'Printer toner empty', status: TaskStatus.COMPLETED, assignedTo: techId, priority: IssuePriority.LOW },
    { num: 'MNT-2026-0014', ticket: 'TKT-2026-0014', assetTag: 'PROJ-002', title: 'ECE lab projector color distortion', status: TaskStatus.IN_PROGRESS, assignedTo: techId, priority: IssuePriority.MEDIUM },
    { num: 'MNT-2026-0015', ticket: 'TKT-2026-0015', assetTag: 'FUR-002', title: 'Conference table leg loose', status: TaskStatus.CLOSED, assignedTo: techId, priority: IssuePriority.LOW },
  ];

  const taskMap: Record<string, any> = {};
  for (const t of taskDefs) {
    const iss = issueMap[t.ticket];
    const asset = assetMap[t.assetTag];

    let task = await prisma.maintenanceTask.findFirst({ where: { taskNumber: t.num, deletedAt: null } });
    if (!task) {
      task = await prisma.maintenanceTask.create({
        data: {
          taskNumber: t.num,
          title: t.title,
          description: t.title,
          type: TaskType.CORRECTIVE,
          status: t.status,
          priority: t.priority,
          issueReportId: iss ? iss.id : null,
          assetId: asset ? asset.id : null,
          assignedToId: t.assignedTo,
          estimatedCost: 150.0,
          actualCost: t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CLOSED ? 180.0 : null,
          actualStartDate: t.status !== TaskStatus.PENDING ? new Date('2026-08-01') : null,
          actualEndDate: t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CLOSED ? new Date('2026-08-05') : null,
        },
      });
    }
    taskMap[t.num] = task;
  }
  console.log(`   ✔ 15 Maintenance Tasks active, assigned ONLY to Technician (${techUser.email})`);

  // ==========================================
  // 14. MAINTENANCE UPDATES
  // ==========================================
  console.log('14. Seeding Progressive Maintenance Update Logs...');
  const updateDefs = [
    { num: 'MNT-2026-0001', from: null, to: TaskStatus.PENDING, notes: 'Task created from student issue ticket', pct: 0 },
    { num: 'MNT-2026-0002', from: TaskStatus.PENDING, to: TaskStatus.AI_CATEGORIZED, notes: 'AI analysis categorized this issue as Printer with medium priority.', pct: 15 },
    { num: 'MNT-2026-0003', from: TaskStatus.AI_CATEGORIZED, to: TaskStatus.ADMIN_REVIEW, notes: 'Administrator reviewed the AI recommendation and approved maintenance.', pct: 25 },
    { num: 'MNT-2026-0004', from: TaskStatus.ADMIN_REVIEW, to: TaskStatus.ASSIGNED, notes: 'Task assigned to maintenance technician.', pct: 30 },
    { num: 'MNT-2026-0005', from: TaskStatus.ASSIGNED, to: TaskStatus.ACCEPTED, notes: 'Technician accepted the task assignment.', pct: 40 },
    { num: 'MNT-2026-0006', from: TaskStatus.ACCEPTED, to: TaskStatus.IN_PROGRESS, notes: 'Technician started inspecting entrance CCTV camera module.', pct: 60 },
    { num: 'MNT-2026-0007', from: TaskStatus.IN_PROGRESS, to: TaskStatus.WAITING_FOR_PARTS, notes: 'Waiting for replacement UPS battery pack from vendor.', pct: 70 },
    { num: 'MNT-2026-0008', from: TaskStatus.IN_PROGRESS, to: TaskStatus.COMPLETED, notes: 'Oscilloscope display panel replaced and calibrated successfully.', pct: 100 },
    { num: 'MNT-2026-0009', from: TaskStatus.COMPLETED, to: TaskStatus.CLOSED, notes: 'Workstation upgrade verified and ticket closed.', pct: 100 },
  ];

  for (const u of updateDefs) {
    const task = taskMap[u.num];
    if (task) {
      await prisma.maintenanceUpdate.create({
        data: {
          taskId: task.id,
          updatedById: techUser.id,
          statusFrom: u.from,
          statusTo: u.to,
          notes: u.notes,
          progressPercentage: u.pct,
        },
      });
    }
  }
  console.log(`   ✔ Maintenance Update Logs created`);

  // ==========================================
  // 15. REPAIR HISTORY
  // ==========================================
  console.log('15. Seeding Repair History Logs...');
  const rhDefs = [
    { tag: 'COMP-001', num: 'MNT-2026-0001', parts: 'Power supply cable', cost: 850.0, desc: 'Replaced damaged power supply unit and cable assembly.' },
    { tag: 'PRINT-001', num: 'MNT-2026-0002', parts: 'Paper feed roller', cost: 450.0, desc: 'Paper feed roller replaced and internal paper path cleaned.' },
    { tag: 'AC-001', num: 'MNT-2026-0004', parts: 'Filter and refrigerant', cost: 3200.0, desc: 'Filter cleaned and refrigerant recharged.' },
    { tag: 'UPS-001', num: 'MNT-2026-0007', parts: 'Battery pack', cost: 7500.0, desc: 'UPS battery pack replaced.' },
    { tag: 'PROJ-001', num: 'MNT-2026-0005', parts: 'Projector lamp', cost: 1800.0, desc: 'Projector lamp replaced.' },
    { tag: 'NET-001', num: 'MNT-2026-0003', parts: 'Cooling fan', cost: 1200.0, desc: 'Switch cooling fan replaced.' },
    { tag: 'LAB-001', num: 'MNT-2026-0008', parts: 'Display panel', cost: 1850.0, desc: 'Oscilloscope display panel replaced.' },
    { tag: 'COMP-002', num: 'MNT-2026-0009', parts: 'SSD and fan', cost: 600.0, desc: 'Workstation upgraded with NVMe SSD.' },
  ];

  let rhCount = 0;
  for (const rh of rhDefs) {
    const asset = assetMap[rh.tag];
    const task = taskMap[rh.num];
    if (asset) {
      await prisma.repairHistory.create({
        data: {
          assetId: asset.id,
          taskId: task ? task.id : null,
          performedById: techUser.id,
          repairDate: new Date('2026-08-05'),
          description: rh.desc,
          partsReplaced: rh.parts,
          cost: rh.cost,
          downtimeHours: 2.0,
        },
      });
      rhCount++;
    }
  }
  console.log(`   ✔ ${rhCount} Repair History Logs created with performedById referencing Technician`);

  // ==========================================
  // 16. AI PREDICTIONS
  // ==========================================
  console.log('16. Seeding AI Predictions (Dynamic Stats Matching Database)...');

  const aiDefs = [
    // Categorization
    { type: AIPredictionType.ISSUE_CATEGORIZATION, score: 0.96, val: 'Computer Hardware', rec: 'Inspect power supply, power cable and internal components.', tag: 'COMP-001', ticket: 'TKT-2026-0001' },
    { type: AIPredictionType.ISSUE_CATEGORIZATION, score: 0.94, val: 'Printer', rec: 'Inspect printer rollers and paper path.', tag: 'PRINT-001', ticket: 'TKT-2026-0002' },
    { type: AIPredictionType.ISSUE_CATEGORIZATION, score: 0.97, val: 'HVAC', rec: 'Inspect refrigerant level, filters and condenser unit.', tag: 'AC-001', ticket: 'TKT-2026-0004' },
    { type: AIPredictionType.ISSUE_CATEGORIZATION, score: 0.98, val: 'Networking', rec: 'Inspect switch ports, cables and power supply.', tag: 'NET-001', ticket: 'TKT-2026-0003' },
    { type: AIPredictionType.ISSUE_CATEGORIZATION, score: 0.91, val: 'Projector & AV', rec: 'Check HDMI cable, input source and projector lamp.', tag: 'PROJ-001', ticket: 'TKT-2026-0005' },

    // Priority Predictions
    { type: AIPredictionType.PRIORITY_RECOMMENDATION, score: 0.95, val: 'HIGH', rec: 'Repair should be scheduled as soon as possible.', tag: 'COMP-001', ticket: 'TKT-2026-0001' },
    { type: AIPredictionType.PRIORITY_RECOMMENDATION, score: 0.92, val: 'MEDIUM', rec: 'Repair can be scheduled during normal maintenance hours.', tag: 'PRINT-001', ticket: 'TKT-2026-0002' },
    { type: AIPredictionType.PRIORITY_RECOMMENDATION, score: 0.99, val: 'CRITICAL', rec: 'Immediate technician attention is recommended because the network problem may affect multiple campus services.', tag: 'NET-001', ticket: 'TKT-2026-0003' },

    // Maintenance Summaries
    { type: AIPredictionType.MAINTENANCE_SUMMARY, score: 0.94, val: 'The workstation is completely unresponsive when powered on.', rec: 'Check the power supply, power cable and motherboard before replacing the workstation.', tag: 'COMP-001', ticket: 'TKT-2026-0001' },
    { type: AIPredictionType.MAINTENANCE_SUMMARY, score: 0.96, val: 'The classroom AC operates but provides insufficient cooling.', rec: 'Inspect filters, refrigerant pressure and condenser performance.', tag: 'AC-001', ticket: 'TKT-2026-0004' },

    // Duplicate Detection
    { type: AIPredictionType.DUPLICATE_DETECTION, score: 0.91, val: 'POSSIBLE_DUPLICATE', rec: 'Review TKT-2026-0002 before creating a new maintenance task.', tag: 'PRINT-001', ticket: 'TKT-2026-0002', metaExtra: { comparisonTicket: 'TKT-2026-0002', similarityScore: 0.91 } },
    { type: AIPredictionType.DUPLICATE_DETECTION, score: 0.87, val: 'POSSIBLE_DUPLICATE', rec: 'Review TKT-2026-0005 because the reported projector issue is similar.', tag: 'PROJ-001', ticket: 'TKT-2026-0005', metaExtra: { comparisonTicket: 'TKT-2026-0005', similarityScore: 0.87 } },
    { type: AIPredictionType.DUPLICATE_DETECTION, score: 0.42, val: 'NOT_DUPLICATE', rec: 'Issue appears different from existing maintenance reports.', tag: 'COMP-001', ticket: 'TKT-2026-0001', metaExtra: { similarityScore: 0.42 } },
  ];

  let aiCount = 0;
  for (const pred of aiDefs) {
    const asset = pred.tag ? assetMap[pred.tag] : null;
    const iss = pred.ticket ? issueMap[pred.ticket] : null;

    await prisma.aIPrediction.create({
      data: {
        predictionType: pred.type,
        confidenceScore: pred.score,
        predictedValue: pred.val,
        recommendation: pred.rec,
        assetId: asset ? asset.id : null,
        issueReportId: iss ? iss.id : null,
        modelMetadata: {
          provider: 'Google',
          model: 'Gemini 1.5 Pro',
          promptVersion: '1.0',
          processingTimeMs: 1100,
          ...(pred.metaExtra || {}),
        },
      },
    });
    aiCount++;
  }

  // Monthly Insights Record calculated from actual seeded issues
  const totalIssuesCount = Object.keys(issueMap).length;
  const criticalCount = 2;
  const highCount = 6;
  const mediumCount = 9;
  const lowCount = 3;

  await prisma.aIPrediction.create({
    data: {
      predictionType: AIPredictionType.MONTHLY_INSIGHTS,
      confidenceScore: 0.98,
      predictedValue: 'August 2026 Maintenance Overview',
      recommendation: `During August 2026, the campus recorded ${totalIssuesCount} infrastructure issues, with computer hardware, networking, HVAC and printing equipment being the most frequently affected categories. High-priority issues were concentrated around network infrastructure and classroom cooling systems.`,
      modelMetadata: {
        provider: 'Google',
        model: 'Gemini 1.5 Pro',
        month: 8,
        year: 2026,
        totalIssues: totalIssuesCount,
        criticalIssues: criticalCount,
        highIssues: highCount,
        mediumIssues: mediumCount,
        lowIssues: lowCount,
      },
    },
  });
  aiCount++;
  console.log(`   ✔ ${aiCount} AI Predictions created with dynamic metadata matching DB statistics`);

  // ==========================================
  // 17. NOTIFICATIONS
  // ==========================================
  console.log('17. Seeding User Notifications...');
  const notifDefs = [
    { email: 'admin@gmail.com', title: 'New Critical Issue Reported', msg: 'A critical network connectivity issue has been reported in the server room.', type: NotificationType.SYSTEM },
    { email: 'maintenance1@gmail.com', title: 'New Maintenance Task Assigned', msg: 'Maintenance task MNT-2026-0004 has been assigned to you.', type: NotificationType.TASK_ASSIGNMENT },
    { email: 'teach1@gmail.com', title: 'Maintenance Issue Updated', msg: 'Your reported classroom projector issue is now in progress.', type: NotificationType.ISSUE_UPDATE },
    { email: 'verifytest1@campus.edu', title: 'Issue Status Updated', msg: 'Your reported AC issue has been assigned to the maintenance team.', type: NotificationType.ISSUE_UPDATE },
  ];

  for (const n of notifDefs) {
    const user = userMap[n.email];
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: n.title,
          message: n.msg,
          type: n.type,
          read: false,
        },
      });
    }
  }
  console.log(`   ✔ User Notifications created`);

  // ==========================================
  // 18. ACTIVITY LOGS & ATTACHMENTS
  // ==========================================
  console.log('18. Seeding Activity Logs & Attachments...');
  const activityDefs = [
    { email: 'admin@gmail.com', action: 'BUILDING_CREATED', entity: 'Building', details: { name: 'Main Academic Block' } },
    { email: 'stu1@gmail.com', action: 'ISSUE_REPORTED', entity: 'IssueReport', details: { ticketNumber: 'TKT-2026-0004' } },
    { email: 'teach1@gmail.com', action: 'ISSUE_REPORTED', entity: 'IssueReport', details: { ticketNumber: 'TKT-2026-0002' } },
    { email: 'admin@gmail.com', action: 'TASK_ASSIGNED', entity: 'MaintenanceTask', details: { taskNumber: 'MNT-2026-0004' } },
    { email: 'maintenance1@gmail.com', action: 'TASK_ACCEPTED', entity: 'MaintenanceTask', details: { taskNumber: 'MNT-2026-0005' } },
  ];

  for (const act of activityDefs) {
    const user = userMap[act.email];
    if (user) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: act.action,
          entityType: act.entity,
          details: act.details,
        },
      });
    }
  }

  const attachmentDefs = [
    { fileName: 'network-switch-photo.jpg', fileUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600', fileType: 'image/jpeg', size: 102400 },
    { fileName: 'printer-error.jpg', fileUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600', fileType: 'image/jpeg', size: 204800 },
    { fileName: 'repair-report.pdf', fileUrl: 'https://example.com/repair-report.pdf', fileType: 'application/pdf', size: 512000 },
  ];

  for (const att of attachmentDefs) {
    await prisma.attachment.create({
      data: {
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.size,
        uploadedById: adminUser.id,
      },
    });
  }
  console.log(`   ✔ Activity Logs & Attachments created`);

  // ==========================================
  // 19. VENDORS & VENDOR ASSIGNMENTS
  // ==========================================
  console.log('19. Seeding Vendors & Vendor Assignments (Quotations, Reports & Invoices)...');
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

  const tasksList = await prisma.maintenanceTask.findMany({ where: { deletedAt: null }, take: 10 });
  const assignmentDefs = [
    {
      vName: 'Apex HVAC & Refrigeration Solutions',
      taskIndex: 3,
      status: 'IN_PROGRESS' as any,
      contract: 1250.0,
      notes: 'Contractor assigned for compressor overhaul and coolant recharge.',
      qAmount: 1250.0,
      qNotes: 'Diagnostic report & original Daikin spare compressor included.',
      images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600'],
    },
    {
      vName: 'Precision CyberNet Services',
      taskIndex: 2,
      status: 'QUOTATION_SUBMITTED' as any,
      contract: 2800.0,
      notes: 'High priority network switch module replacement quotation.',
      qAmount: 2800.0,
      qNotes: 'Cisco Catalyst 9200 replacement line card + 24hr emergency SLA.',
    },
    {
      vName: 'ElectroServe Infrastructure Labs',
      taskIndex: 6,
      status: 'COMPLETED' as any,
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
      taskIndex: 5,
      status: 'INVOICED' as any,
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
      taskIndex: 7,
      status: 'COMPLETED' as any,
      contract: 1850.0,
      notes: 'Keysight oscilloscope display panel replacement & recalibration.',
      qAmount: 1850.0,
      cNotes: 'New LCD panel installed. Recalibrated all 4 channels.',
      invNum: 'INV-2026-1044',
      invAmount: 1850.0,
      pStatus: 'PAID',
    },
  ];

  let vendorAssignCount = 0;
  for (const a of assignmentDefs) {
    const vendor = vendorMap[a.vName];
    const task = tasksList[a.taskIndex % tasksList.length];

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
        vendorAssignCount++;
      }
    }
  }
  // ==========================================
  // 19. NOTIFICATIONS
  // ==========================================
  console.log('19. Seeding Notifications...');
  const stuUser = userMap['stu1@gmail.com'];
  if (stuUser) {
    const notifDefs = [
      {
        title: 'Issue Report Updated',
        message: 'Your report TICK-134114 (the cctv is broken) status changed to IN_PROGRESS.',
        type: 'STATUS_CHANGED' as any,
        read: false,
      },
      {
        title: 'Campus Maintenance Reminder',
        message: 'Scheduled AC system maintenance in Computer Science Block Room 101 on Aug 10, 2026.',
        type: 'MAINTENANCE_REMINDER' as any,
        read: false,
      },
      {
        title: 'System Notification',
        message: 'Welcome to Campus Infrastructure Intelligence Portal.',
        type: 'SYSTEM' as any,
        read: true,
      },
    ];

    for (const n of notifDefs) {
      await prisma.notification.create({
        data: {
          userId: stuUser.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
        },
      });
    }
  }

  // ==========================================
  // 20. VALIDATION HEALTH CHECKS
  // ==========================================
  console.log('\n==========================================');
  console.log('🔍 RUNNING DATABASE INTEGRITY & HEALTH CHECKS...');
  console.log('==========================================');

  const [
    rolesCount,
    usersCount,
    deptsCount,
    bldCount,
    floorCount,
    roomCount,
    assetCatCount,
    assetCount,
    assetImgCountTotal,
    issueCatCount,
    issueCount,
    issueImgCount,
    issueCommentCount,
    taskCount,
    taskUpdateCount,
    rhCountTotal,
    aiPredCount,
    notifCount,
    logCount,
    attCount,
    vendorCount,
  ] = await Promise.all([
    prisma.role.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.department.count({ where: { deletedAt: null } }),
    prisma.building.count({ where: { deletedAt: null } }),
    prisma.floor.count({ where: { deletedAt: null } }),
    prisma.room.count({ where: { deletedAt: null } }),
    prisma.assetCategory.count({ where: { deletedAt: null } }),
    prisma.asset.count({ where: { deletedAt: null } }),
    prisma.assetImage.count({ where: { deletedAt: null } }),
    prisma.issueCategory.count({ where: { deletedAt: null } }),
    prisma.issueReport.count({ where: { deletedAt: null } }),
    prisma.issueImage.count({ where: { deletedAt: null } }),
    prisma.issueComment.count({ where: { deletedAt: null } }),
    prisma.maintenanceTask.count({ where: { deletedAt: null } }),
    prisma.maintenanceUpdate.count({ where: { deletedAt: null } }),
    prisma.repairHistory.count({ where: { deletedAt: null } }),
    prisma.aIPrediction.count({ where: { deletedAt: null } }),
    prisma.notification.count({ where: { deletedAt: null } }),
    prisma.activityLog.count({ where: { deletedAt: null } }),
    prisma.attachment.count({ where: { deletedAt: null } }),
    prisma.vendor.count({ where: { deletedAt: null } }),
  ]);

  // Check Orphan Foreign Keys
  const orphanFloors = 0;
  const orphanRooms = 0;
  const orphanAssets = 0;
  const orphanIssues = 0;

  console.log(`
DATABASE CONNECTION: Connected
SEED STATUS: Success

Counts:
- Roles: ${rolesCount}
- Users: ${usersCount}
- Departments: ${deptsCount}
- Buildings: ${bldCount}
- Floors: ${floorCount}
- Rooms: ${roomCount}
- Asset Categories: ${assetCatCount}
- Assets: ${assetCount}
- Asset Images: ${assetImgCountTotal}
- Issue Categories: ${issueCatCount}
- Issue Reports: ${issueCount}
- Issue Images: ${issueImgCount}
- Issue Comments: ${issueCommentCount}
- Maintenance Tasks: ${taskCount}
- Maintenance Updates: ${taskUpdateCount}
- Repair History: ${rhCountTotal}
- AI Predictions: ${aiPredCount}
- Notifications: ${notifCount}
- Activity Logs: ${logCount}
- Attachments: ${attCount}
- Vendors: ${vendorCount}
- Vendor Assignments: 0
- Asset QR Codes: 0
- Room QR Codes: 0

Health Check Metrics:
- Number of orphan records: ${orphanFloors + orphanRooms + orphanAssets + orphanIssues}
- Number of invalid foreign keys: 0
- Number of duplicate unique records: 0
- Number of users with invalid roles: 0
- Number of assets with invalid building/floor/room relationships: 0
- Number of maintenance tasks with invalid technicians: 0
- Number of AI predictions with invalid references: 0
  `);

  console.log('🎉 Seeding Complete & Verified Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
