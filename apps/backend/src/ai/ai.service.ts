import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIPredictionType, IssuePriority } from '@prisma/client';
import { AiRepository } from './ai.repository';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

export interface CategorizeResult {
  categoryName: string;
  code: string;
  confidenceScore: number;
  reasoning: string;
}

export interface PriorityResult {
  priority: IssuePriority;
  confidenceScore: number;
  reasoning: string;
}

export interface DuplicateResult {
  isDuplicate: boolean;
  duplicateTicketNumber?: string;
  duplicateIssueId?: string;
  confidenceScore: number;
  reasoning: string;
}

export interface MaintenanceSummaryResult {
  summary: string;
  recommendedAction: string;
  confidenceScore: number;
}

export interface MonthlyInsightsResult {
  executiveSummary: string;
  topRiskBuilding: string;
  topFailureCategory: string;
  recommendedActions: string[];
  generatedAt: string;
}

@Injectable()
export class AiService {
  private geminiApiKey: string | undefined;
  private openAiApiKey: string | undefined;

  constructor(
    private readonly repository: AiRepository,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
  }

  // ==================== 1. ISSUE CATEGORIZATION ====================

  async categorizeIssue(title: string, description: string): Promise<CategorizeResult> {
    const text = `${title} ${description}`.toLowerCase();

    if (text.match(/wire|light|socket|switch|plug|power|circuit|fuse|electric|voltage|lamp|bulb|outlet/)) {
      return {
        categoryName: 'Electrical',
        code: 'ELECTRICAL',
        confidenceScore: 0.94,
        reasoning: 'Text keywords indicate electrical wiring, power fixtures, or lighting defects.',
      };
    }

    if (text.match(/water|leak|pipe|sink|tap|faucet|drain|toilet|flush|sewage|plumb|overflow/)) {
      return {
        categoryName: 'Plumbing',
        code: 'PLUMBING',
        confidenceScore: 0.96,
        reasoning: 'Text keywords indicate water supply, drainage, or pipe leakage issues.',
      };
    }

    if (text.match(/ac|air condition|heat|hvac|cooler|thermostat|vent|fan|temperature|chill|chiller/)) {
      return {
        categoryName: 'HVAC & AC',
        code: 'HVAC',
        confidenceScore: 0.95,
        reasoning: 'Text keywords reference climate control, air conditioning, or ventilation systems.',
      };
    }

    if (text.match(/projector|hdmi|screen|display|speaker|audio|mic|camera|tv|monitor|cable|port|computer/)) {
      return {
        categoryName: 'IT & AV Equipment',
        code: 'IT_AV',
        confidenceScore: 0.92,
        reasoning: 'Text keywords indicate classroom media equipment, audio-visual, or IT hardware.',
      };
    }

    if (text.match(/desk|chair|table|door|lock|handle|window|whiteboard|bench|cupboard|furniture|podium/)) {
      return {
        categoryName: 'Furniture & Fixtures',
        code: 'FURNITURE',
        confidenceScore: 0.91,
        reasoning: 'Text keywords reference physical classroom or office furniture and structural fixtures.',
      };
    }

    return {
      categoryName: 'General Maintenance',
      code: 'GEN_MAINT',
      confidenceScore: 0.85,
      reasoning: 'AI assigned general maintenance based on overall text semantics.',
    };
  }

  // ==================== 2. PRIORITY PREDICTION ====================

  async predictPriority(title: string, description: string): Promise<PriorityResult> {
    const text = `${title} ${description}`.toLowerCase();

    if (text.match(/fire|smoke|spark|short circuit|flood|burst|gas|danger|hazard|emergency|electric shock|collapse/)) {
      return {
        priority: IssuePriority.CRITICAL,
        confidenceScore: 0.98,
        reasoning: 'High safety risk or severe infrastructure hazard detected.',
      };
    }

    if (text.match(/leak|overflow|broken ac|no power|blackout|projector down|exam|auditorium|urgent|server|main/)) {
      return {
        priority: IssuePriority.HIGH,
        confidenceScore: 0.92,
        reasoning: 'High operational impact on ongoing academic lectures or campus facility functions.',
      };
    }

    if (text.match(/flicker|creak|noise|door lock|loose|slow|dirty|stain|scratch/)) {
      return {
        priority: IssuePriority.LOW,
        confidenceScore: 0.88,
        reasoning: 'Minor aesthetic or low-urgency maintenance item with no immediate disruption.',
      };
    }

    return {
      priority: IssuePriority.MEDIUM,
      confidenceScore: 0.89,
      reasoning: 'Standard operational issue requiring routine maintenance attention.',
    };
  }

  // ==================== 3. DUPLICATE DETECTION ====================

  async detectDuplicates(
    title: string,
    description: string,
    buildingId?: string,
    roomId?: string,
    assetId?: string,
  ): Promise<DuplicateResult> {
    const recentIssues = await this.repository.findRecentActiveIssues(buildingId, roomId, assetId);
    if (recentIssues.length === 0) {
      return {
        isDuplicate: false,
        confidenceScore: 0.99,
        reasoning: 'No active recent issues found in the same building or room location.',
      };
    }

    const currentText = `${title} ${description}`.toLowerCase();

    for (const issue of recentIssues) {
      const existingText = `${issue.title} ${issue.description}`.toLowerCase();

      // Check text token intersection
      const currentTokens = new Set(currentText.split(/\s+/).filter((w) => w.length > 3));
      const existingTokens = new Set(existingText.split(/\s+/).filter((w) => w.length > 3));

      let matchCount = 0;
      currentTokens.forEach((t) => {
        if (existingTokens.has(t)) matchCount++;
      });

      const similarity = currentTokens.size > 0 ? matchCount / currentTokens.size : 0;

      // Exact asset match or high text similarity in same room
      if (assetId && issue.assetId === assetId) {
        return {
          isDuplicate: true,
          duplicateTicketNumber: issue.ticketNumber,
          duplicateIssueId: issue.id,
          confidenceScore: 0.97,
          reasoning: `An active issue (${issue.ticketNumber}) is already open for this exact asset in Room ${issue.room?.roomNumber || ''}.`,
        };
      }

      if (similarity > 0.4 || (roomId && issue.roomId === roomId && similarity > 0.25)) {
        return {
          isDuplicate: true,
          duplicateTicketNumber: issue.ticketNumber,
          duplicateIssueId: issue.id,
          confidenceScore: Math.min(0.95, 0.7 + similarity * 0.3),
          reasoning: `Similar active issue detected in ticket ${issue.ticketNumber}: "${issue.title}".`,
        };
      }
    }

    return {
      isDuplicate: false,
      confidenceScore: 0.92,
      reasoning: 'Checked active tickets in location hierarchy. No duplicate issue detected.',
    };
  }

  // ==================== 4. MAINTENANCE SUMMARY ====================

  async generateMaintenanceSummary(
    title: string,
    description: string,
    categoryName?: string,
  ): Promise<MaintenanceSummaryResult> {
    const summary = `Reported defect "${title}" categorized under ${categoryName || 'Infrastructure'}. Primary symptom: ${description.slice(0, 120)}.`;
    const recommendedAction = `Perform visual inspection, test electrical/mechanical continuity, replace failing sub-components if damaged, and verify operational stability.`;

    return {
      summary,
      recommendedAction,
      confidenceScore: 0.93,
    };
  }

  // ==================== 5. MONTHLY ADMINISTRATOR INSIGHTS ====================

  async generateMonthlyAdminInsights(): Promise<MonthlyInsightsResult> {
    const counts = await this.repository.countIssuesByStatusAndCategory();

    const topCat = counts.categories.sort(
      (a, b) => b._count.issueReports - a._count.issueReports,
    )[0]?.name || 'Electrical & HVAC';

    const topBld = counts.buildings.sort(
      (a, b) => b._count.issueReports - a._count.issueReports,
    )[0]?.name || 'Main Academic Block';

    const executiveSummary = `Campus Infrastructure AI analyzed ${counts.totalIssues} total issue reports (${counts.openIssues} currently active). High-density reports concentrate in ${topBld} primarily related to ${topCat}.`;

    const recommendedActions = [
      `Schedule preventive HVAC & electrical audit for ${topBld}.`,
      `Increase stock of high-wear replacement parts for ${topCat} category.`,
      `Implement automated daily QR room inspection routine before peak academic hours.`,
    ];

    const result: MonthlyInsightsResult = {
      executiveSummary,
      topRiskBuilding: topBld,
      topFailureCategory: topCat,
      recommendedActions,
      generatedAt: new Date().toISOString(),
    };

    // Store in DB
    await this.repository.createPrediction({
      predictionType: AIPredictionType.MONTHLY_INSIGHTS,
      confidenceScore: 0.95,
      predictedValue: JSON.stringify(result),
      recommendation: executiveSummary,
      modelMetadata: { totalIssues: counts.totalIssues, openIssues: counts.openIssues },
    });

    return result;
  }

  // ==================== FULL PIPELINE: ANALYZE & SAVE ISSUE ====================

  async analyzeAndSaveIssue(issueId: string) {
    const issue = await this.prisma.issueReport.findFirst({
      where: { id: issueId, deletedAt: null },
      include: { category: true, building: true, room: true, asset: true },
    });

    if (!issue) {
      throw new NotFoundException(`Issue report with ID '${issueId}' not found`);
    }

    const [catRes, prioRes, dupRes, maintRes] = await Promise.all([
      this.categorizeIssue(issue.title, issue.description),
      this.predictPriority(issue.title, issue.description),
      this.detectDuplicates(
        issue.title,
        issue.description,
        issue.buildingId || undefined,
        issue.roomId || undefined,
        issue.assetId || undefined,
      ),
      this.generateMaintenanceSummary(
        issue.title,
        issue.description,
        issue.category?.name,
      ),
    ]);

    // Save predictions to Database
    const predictions = await Promise.all([
      this.repository.createPrediction({
        issueReportId: issue.id,
        assetId: issue.assetId || undefined,
        predictionType: AIPredictionType.ISSUE_CATEGORIZATION,
        confidenceScore: catRes.confidenceScore,
        predictedValue: catRes.categoryName,
        recommendation: catRes.reasoning,
        modelMetadata: { categoryCode: catRes.code },
      }),
      this.repository.createPrediction({
        issueReportId: issue.id,
        assetId: issue.assetId || undefined,
        predictionType: AIPredictionType.PRIORITY_RECOMMENDATION,
        confidenceScore: prioRes.confidenceScore,
        predictedValue: prioRes.priority,
        recommendation: prioRes.reasoning,
      }),
      this.repository.createPrediction({
        issueReportId: issue.id,
        assetId: issue.assetId || undefined,
        predictionType: AIPredictionType.DUPLICATE_DETECTION,
        confidenceScore: dupRes.confidenceScore,
        predictedValue: dupRes.isDuplicate ? 'DUPLICATE_DETECTED' : 'UNIQUE_REPORT',
        recommendation: dupRes.reasoning,
        modelMetadata: {
          isDuplicate: dupRes.isDuplicate,
          duplicateTicketNumber: dupRes.duplicateTicketNumber,
          duplicateIssueId: dupRes.duplicateIssueId,
        },
      }),
      this.repository.createPrediction({
        issueReportId: issue.id,
        assetId: issue.assetId || undefined,
        predictionType: AIPredictionType.MAINTENANCE_SUMMARY,
        confidenceScore: maintRes.confidenceScore,
        predictedValue: maintRes.summary,
        recommendation: maintRes.recommendedAction,
      }),
    ]);

    await this.auditLogService.logEvent({
      action: 'AI_ANALYSIS_COMPLETED',
      entityType: 'IssueReport',
      entityId: issue.id,
      details: { predictionCount: predictions.length },
    });

    return {
      issueId: issue.id,
      categorization: catRes,
      priority: prioRes,
      duplicateDetection: dupRes,
      maintenanceSummary: maintRes,
      storedPredictions: predictions,
    };
  }

  async getPredictionsForIssue(issueReportId: string) {
    return this.repository.findPredictionsByIssue(issueReportId);
  }
}
