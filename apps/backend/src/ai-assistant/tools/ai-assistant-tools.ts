import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUserContext, ToolDefinition } from '../types/ai-assistant.types';
import { IssueStatus, TaskStatus, VendorAssignmentStatus } from '@prisma/client';

@Injectable()
export class AIAssistantTools {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * OpenAPI Function Tool Definitions provided to OpenAI API
   */
  public getToolDefinitions(user: AuthenticatedUserContext): ToolDefinition[] {
    const roleName = user.role?.name || 'STUDENT';

    const tools: ToolDefinition[] = [
      {
        type: 'function',
        function: {
          name: 'getMyIssues',
          description: 'Fetch infrastructure issue reports related to the authenticated user.',
          parameters: {
            type: 'object',
            properties: {
              status: { type: 'string', description: 'Filter by issue status: OPEN, IN_PROGRESS, RESOLVED, CLOSED' },
              limit: { type: 'number', description: 'Maximum number of items to return (default 5)' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getIssueDetails',
          description: 'Get detailed information for a specific issue report by ticket number (e.g. TICK-1024) or ID.',
          parameters: {
            type: 'object',
            properties: {
              identifier: { type: 'string', description: 'Ticket number or issue UUID' },
            },
            required: ['identifier'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getLostAndFoundItems',
          description: 'Search active Lost and Found items on campus.',
          parameters: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'LOST or FOUND' },
              query: { type: 'string', description: 'Keyword search term' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getCampusInformation',
          description: 'Get standard guidance on campus processes (how to report issue, scan QR, claim lost item).',
          parameters: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'Topic: report_issue, scan_qr, lost_found, vendor_invoice' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'getAssetDetails',
          description: 'Get asset specifications, location, and maintenance status by asset tag or serial number.',
          parameters: {
            type: 'object',
            properties: {
              assetTag: { type: 'string', description: 'Asset tag (e.g. AST-10001) or serial number' },
            },
            required: ['assetTag'],
          },
        },
      },
    ];

    if (roleName === 'ADMIN' || roleName === 'TECHNICIAN') {
      tools.push({
        type: 'function',
        function: {
          name: 'getMyMaintenanceTasks',
          description: 'Get maintenance tasks assigned to the technician or all active tasks for Admin.',
          parameters: {
            type: 'object',
            properties: {
              status: { type: 'string', description: 'Filter status: ASSIGNED, IN_PROGRESS, WAITING_FOR_PARTS' },
            },
          },
        },
      });

      tools.push({
        type: 'function',
        function: {
          name: 'getBuildingIssueSummary',
          description: 'Get summary of issues per building or for a specific building.',
          parameters: {
            type: 'object',
            properties: {
              buildingCode: { type: 'string', description: 'Building code e.g. MAIN, LAB' },
            },
          },
        },
      });
    }

    if (roleName === 'ADMIN' || roleName === 'VENDOR') {
      tools.push({
        type: 'function',
        function: {
          name: 'getMyVendorRepairs',
          description: 'Fetch vendor repair assignments and invoice statuses.',
          parameters: {
            type: 'object',
            properties: {
              status: { type: 'string', description: 'REQUESTED, IN_PROGRESS, COMPLETED, INVOICED' },
            },
          },
        },
      });
    }

    return tools;
  }

  /**
   * Execute tool with backend RBAC checks
   */
  public async executeTool(
    toolName: string,
    args: Record<string, any>,
    user: AuthenticatedUserContext,
  ): Promise<any> {
    const roleName = user.role?.name || 'STUDENT';

    switch (toolName) {
      case 'getMyIssues': {
        const limit = args.limit || 5;
        let where: any = { deletedAt: null };

        if (roleName === 'STUDENT' || roleName === 'FACULTY') {
          where.reportedById = user.id;
        } else if (roleName === 'TECHNICIAN') {
          where.maintenanceTasks = { some: { assignedToId: user.id } };
        } else if (roleName === 'VENDOR') {
          where.maintenanceTasks = {
            some: { vendorAssignments: { some: { vendor: { email: user.email } } } },
          };
        }

        if (args.unresolved || args.status === 'UNRESOLVED') {
          where.status = { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] };
        } else if (args.status) {
          where.status = args.status as IssueStatus;
        }

        const issues = await this.prisma.issueReport.findMany({
          where,
          include: { building: true, room: true, category: true, asset: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });

        return issues.map((i) => ({
          ticketNumber: i.ticketNumber,
          title: i.title,
          status: i.status,
          priority: i.priority,
          location: `${i.building?.name || 'Campus'} - Room ${i.room?.roomNumber || 'General'}`,
          asset: i.asset?.name || null,
          createdAt: i.createdAt,
        }));
      }

      case 'getIssueDetails': {
        const identifier = args.identifier;
        if (!identifier) return { error: 'Identifier is required' };

        const issue = await this.prisma.issueReport.findFirst({
          where: {
            deletedAt: null,
            OR: [{ ticketNumber: identifier }, { id: identifier }],
          },
          include: {
            building: true,
            room: true,
            asset: true,
            category: true,
            maintenanceTasks: {
              include: {
                assignedTo: { select: { firstName: true, lastName: true, email: true } },
                vendorAssignments: { include: { vendor: true } },
              },
            },
          },
        });

        if (!issue) return { error: `Issue '${identifier}' not found.` };

        // RBAC Verification
        if (roleName === 'STUDENT' || roleName === 'FACULTY') {
          if (issue.reportedById !== user.id) {
            return { error: 'Access Denied: You can only view details of your own reported issues.' };
          }
        } else if (roleName === 'VENDOR') {
          const isAssigned = issue.maintenanceTasks?.some((t) =>
            t.vendorAssignments?.some((v) => v.vendor?.email?.toLowerCase() === user.email.toLowerCase()),
          );
          if (!isAssigned) {
            return { error: 'Access Denied: This issue is not associated with your vendor repairs.' };
          }
        }

        return {
          ticketNumber: issue.ticketNumber,
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
          location: `${issue.building?.name || ''} Room ${issue.room?.roomNumber || ''}`,
          category: issue.category?.name || 'General',
          assetName: issue.asset?.name || null,
          tasksCount: issue.maintenanceTasks?.length || 0,
          createdAt: issue.createdAt,
        };
      }

      case 'getMyMaintenanceTasks': {
        if (roleName !== 'ADMIN' && roleName !== 'TECHNICIAN') {
          return { error: 'Access Denied: Maintenance tasks are accessible only to Technicians and Admins.' };
        }

        let where: any = { deletedAt: null };
        if (roleName === 'TECHNICIAN') {
          where.assignedToId = user.id;
        }

        if (args.status) {
          where.status = args.status as TaskStatus;
        }

        const tasks = await this.prisma.maintenanceTask.findMany({
          where,
          include: { asset: true, issueReport: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        return tasks.map((t) => ({
          taskNumber: t.taskNumber,
          title: t.title,
          status: t.status,
          priority: t.priority,
          asset: t.asset?.name || 'General Facility',
          issueTicket: t.issueReport?.ticketNumber || null,
          dueDate: t.scheduledEndDate,
        }));
      }

      case 'getMyVendorRepairs': {
        if (roleName !== 'ADMIN' && roleName !== 'VENDOR') {
          return { error: 'Access Denied: Vendor repairs are accessible only to Vendors and Admins.' };
        }

        let where: any = { deletedAt: null };
        if (roleName === 'VENDOR') {
          where.vendor = { email: user.email };
        }

        if (args.status) {
          where.status = args.status as VendorAssignmentStatus;
        }

        const assignments = await this.prisma.vendorAssignment.findMany({
          where,
          include: { vendor: true, task: { include: { asset: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        return assignments.map((a) => ({
          assignmentId: a.id,
          companyName: a.vendor?.companyName,
          taskNumber: a.task?.taskNumber,
          assetName: a.task?.asset?.name,
          contractAmount: a.contractAmount,
          quotationAmount: a.quotationAmount,
          invoiceNumber: a.invoiceNumber,
          invoiceAmount: a.invoiceAmount,
          paymentStatus: a.paymentStatus,
          status: a.status,
        }));
      }

      case 'getBuildingIssueSummary': {
        if (roleName !== 'ADMIN' && roleName !== 'TECHNICIAN') {
          return { error: 'Access Denied: Building analytics are restricted.' };
        }

        const buildings = await this.prisma.building.findMany({
          where: { deletedAt: null },
          include: {
            issueReports: {
              where: { deletedAt: null, status: { notIn: [IssueStatus.CLOSED, IssueStatus.RESOLVED] } },
            },
          },
        });

        return buildings.map((b) => ({
          buildingCode: b.code,
          name: b.name,
          activeUnresolvedIssues: b.issueReports?.length || 0,
        }));
      }

      case 'getAssetDetails': {
        const assetTag = args.assetTag;
        const asset = await this.prisma.asset.findFirst({
          where: {
            deletedAt: null,
            OR: [{ assetTag: assetTag }, { serialNumber: assetTag }, { name: { contains: assetTag, mode: 'insensitive' } }],
          },
          include: { building: true, room: true, category: true },
        });

        if (!asset) return { error: `Asset matching '${assetTag}' not found.` };

        return {
          assetTag: asset.assetTag,
          name: asset.name,
          category: asset.category?.name,
          status: asset.status,
          location: `${asset.building?.name || ''} Room ${asset.room?.roomNumber || ''}`,
          manufacturer: asset.manufacturer,
          modelNumber: asset.modelNumber,
          serialNumber: asset.serialNumber,
          purchaseDate: asset.purchaseDate,
        };
      }

      case 'getLostAndFoundItems': {
        let where: any = { deletedAt: null };
        if (args.type) {
          where.type = args.type;
        }
        if (args.query && typeof args.query === 'string' && args.query.trim().length > 0) {
          const q = args.query.trim().toLowerCase();
          const isGenericQuestion =
            q.includes('are there') ||
            q.includes('show') ||
            q.includes('any lost') ||
            q.includes('any found') ||
            q.includes('lost item') ||
            q.includes('found item');

          if (!isGenericQuestion) {
            where.OR = [
              { title: { contains: args.query, mode: 'insensitive' } },
              { description: { contains: args.query, mode: 'insensitive' } },
            ];
          }
        }

        const items = await this.prisma.lostFoundItem.findMany({
          where,
          include: { category: true, building: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        return items.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          category: item.category?.name,
          location: item.building?.name || item.locationDescription || 'Campus',
          dateOccurred: item.dateOccurred,
          status: item.status,
        }));
      }

      case 'getCampusInformation': {
        const topic = args.topic || 'general';
        switch (topic) {
          case 'report_issue':
            return {
              title: 'How to Report an Infrastructure Issue',
              steps: [
                '1. Go to Report Issue page or click Scan QR in navigation.',
                '2. If you scan a room or asset QR code, the location and asset details are populated automatically.',
                '3. Choose a category, set the title and description, and attach photos if relevant.',
                '4. Submit the ticket to receive a tracking ticket number (e.g. TICK-XXXXXX).',
              ],
            };
          case 'scan_qr':
            return {
              title: 'Using the QR Code Scanner',
              steps: [
                '1. Open Scan QR from the sidebar menu.',
                '2. Point your camera at the QR code tag on the door or equipment.',
                '3. The app will validate the QR payload and redirect you to the pre-filled issue form.',
              ],
            };
          case 'lost_found':
            return {
              title: 'Lost and Found Instructions',
              steps: [
                '1. Open Lost & Found from navigation.',
                '2. Select Report Lost Item or Report Found Item.',
                '3. Enter details, upload a picture, and specify location.',
                '4. If a matching item exists, you can submit a Claim Match request.',
              ],
            };
          default:
            return {
              title: 'Campus Infrastructure Intelligence Guidance',
              description: 'Campus platform for managing buildings, assets, maintenance, issue tickets, QR codes, and lost & found.',
            };
        }
      }

      case 'getNotifications': {
        const notifications = await this.prisma.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        return notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt,
        }));
      }

      case 'getCampusAnalytics': {
        if (roleName !== 'ADMIN') {
          return { error: 'Access Denied: Campus operational analytics are restricted to System Administrators.' };
        }

        const [
          totalIssues,
          unresolvedIssues,
          resolvedIssues,
          overdueTasks,
          buildings,
          failingAssets,
          vendorAssignments,
        ] = await Promise.all([
          this.prisma.issueReport.count({ where: { deletedAt: null } }),
          this.prisma.issueReport.count({
            where: { deletedAt: null, status: { notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED] } },
          }),
          this.prisma.issueReport.count({
            where: { deletedAt: null, status: { in: [IssueStatus.RESOLVED, IssueStatus.CLOSED] } },
          }),
          this.prisma.maintenanceTask.count({
            where: { deletedAt: null, status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CLOSED] } },
          }),
          this.prisma.building.findMany({
            where: { deletedAt: null },
            include: {
              issueReports: {
                where: { deletedAt: null, status: { notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED] } },
              },
            },
          }),
          this.prisma.asset.findMany({
            where: { deletedAt: null },
            include: {
              issueReports: { where: { deletedAt: null } },
            },
            take: 10,
          }),
          this.prisma.vendorAssignment.findMany({
            where: { deletedAt: null },
            include: { vendor: true },
          }),
        ]);

        const buildingSummary = buildings
          .map((b) => ({
            code: b.code,
            name: b.name,
            unresolvedCount: b.issueReports.length,
          }))
          .sort((a, b) => b.unresolvedCount - a.unresolvedCount);

        const repeatedFailingAssets = failingAssets
          .filter((a) => a.issueReports.length > 0)
          .map((a) => ({
            assetTag: a.assetTag,
            name: a.name,
            issueCount: a.issueReports.length,
            status: a.status,
          }))
          .sort((a, b) => b.issueCount - a.issueCount)
          .slice(0, 5);

        // Group vendor pending repairs
        const vendorStats: Record<string, { companyName: string; pendingRepairs: number }> = {};
        for (const va of vendorAssignments) {
          const vName = va.vendor?.companyName || 'External Contractor';
          if (!vendorStats[vName]) {
            vendorStats[vName] = { companyName: vName, pendingRepairs: 0 };
          }
          if (va.status !== 'COMPLETED' && va.status !== 'INVOICED') {
            vendorStats[vName].pendingRepairs++;
          }
        }

        const topPendingVendors = Object.values(vendorStats)
          .sort((a, b) => b.pendingRepairs - a.pendingRepairs)
          .slice(0, 5);

        const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 100;

        return {
          totalIssues,
          unresolvedIssues,
          resolvedIssues,
          overdueTasks,
          resolutionRate,
          topBuildingWithMostIssues: buildingSummary[0] || null,
          buildingRanking: buildingSummary.slice(0, 5),
          repeatedFailingAssets,
          topPendingVendors,
        };
      }

      case 'getRoomInformation': {
        const query = args.query || args.roomNumber;
        if (!query) return { error: 'Room number or query is required' };

        const room = await this.prisma.room.findFirst({
          where: {
            deletedAt: null,
            OR: [{ roomNumber: { contains: query, mode: 'insensitive' } }, { name: { contains: query, mode: 'insensitive' } }],
          },
          include: { building: true, floor: true, assets: { where: { deletedAt: null } } },
        });

        if (!room) return { error: `Room matching '${query}' not found.` };

        return {
          roomNumber: room.roomNumber,
          name: room.name,
          building: room.building?.name,
          floorNumber: room.floor?.floorNumber,
          type: room.type,
          capacity: room.capacity,
          assetCount: room.assets?.length || 0,
          assets: room.assets?.map((a) => ({ assetTag: a.assetTag, name: a.name, status: a.status })),
        };
      }

      case 'getVendorInformation': {
        if (roleName !== 'ADMIN' && roleName !== 'VENDOR') {
          return { error: 'Access Denied: Vendor information is restricted.' };
        }

        let where: any = { deletedAt: null };
        if (roleName === 'VENDOR') {
          where.vendor = { email: user.email };
        }

        const assignments = await this.prisma.vendorAssignment.findMany({
          where,
          include: { vendor: true, task: { include: { issueReport: true } } },
          orderBy: { createdAt: 'desc' },
        });

        const pending = assignments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'INVOICED');
        const invoiced = assignments.filter((a) => a.invoiceNumber);

        return {
          totalAssignments: assignments.length,
          pendingRepairsCount: pending.length,
          invoicedCount: invoiced.length,
          assignments: assignments.map((a) => ({
            id: a.id,
            companyName: a.vendor?.companyName,
            taskNumber: a.task?.taskNumber,
            issueTicket: a.task?.issueReport?.ticketNumber,
            status: a.status,
            contractAmount: a.contractAmount,
            invoiceNumber: a.invoiceNumber,
            invoiceAmount: a.invoiceAmount,
            paymentStatus: a.paymentStatus,
          })),
        };
      }

      default:
        return { error: `Tool '${toolName}' not recognized.` };
    }
  }
}
