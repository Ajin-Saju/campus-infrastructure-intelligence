import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIPredictionType, Prisma } from '@prisma/client';

export interface CreateAiPredictionParams {
  issueReportId?: string;
  assetId?: string;
  predictionType: AIPredictionType;
  confidenceScore: number;
  predictedValue: string;
  recommendation?: string;
  modelMetadata?: Record<string, any>;
}

@Injectable()
export class AiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPrediction(params: CreateAiPredictionParams) {
    return this.prisma.aIPrediction.create({
      data: {
        issueReportId: params.issueReportId || null,
        assetId: params.assetId || null,
        predictionType: params.predictionType,
        confidenceScore: params.confidenceScore,
        predictedValue: params.predictedValue,
        recommendation: params.recommendation || null,
        modelMetadata: params.modelMetadata || {},
      },
    });
  }

  async findPredictionsByIssue(issueReportId: string) {
    return this.prisma.aIPrediction.findMany({
      where: {
        issueReportId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestInsights() {
    return this.prisma.aIPrediction.findFirst({
      where: {
        predictionType: AIPredictionType.MONTHLY_INSIGHTS,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecentActiveIssues(buildingId?: string, roomId?: string, assetId?: string) {
    return this.prisma.issueReport.findMany({
      where: {
        deletedAt: null,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        OR: [
          ...(buildingId ? [{ buildingId }] : []),
          ...(roomId ? [{ roomId }] : []),
          ...(assetId ? [{ assetId }] : []),
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        building: true,
        room: true,
        asset: true,
      },
    });
  }

  async countIssuesByStatusAndCategory() {
    const [totalIssues, openIssues, categories, buildings] = await Promise.all([
      this.prisma.issueReport.count({ where: { deletedAt: null } }),
      this.prisma.issueReport.count({ where: { deletedAt: null, status: 'OPEN' } }),
      this.prisma.issueCategory.findMany({
        where: { deletedAt: null },
        include: { _count: { select: { issueReports: true } } },
      }),
      this.prisma.building.findMany({
        where: { deletedAt: null },
        include: { _count: { select: { issueReports: true } } },
      }),
    ]);

    return { totalIssues, openIssues, categories, buildings };
  }
}
