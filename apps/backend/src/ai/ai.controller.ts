import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AnalyzeIssueTextDto } from './dto/analyze-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-text')
  async analyzeText(@Body() dto: AnalyzeIssueTextDto) {
    const desc = dto.description?.trim() || dto.title;
    const [categorization, priority, duplicateDetection] = await Promise.all([
      this.aiService.categorizeIssue(dto.title, desc),
      this.aiService.predictPriority(dto.title, desc),
      this.aiService.detectDuplicates(
        dto.title,
        desc,
        dto.buildingId,
        dto.roomId,
        dto.assetId,
      ),
    ]);

    return {
      categorization,
      priority,
      duplicateDetection,
    };
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Post('analyze-issue/:issueId')
  async analyzeIssue(@Param('issueId') issueId: string) {
    return this.aiService.analyzeAndSaveIssue(issueId);
  }

  @Roles('ADMIN', 'TECHNICIAN')
  @Get('predictions/issue/:issueId')
  async getPredictionsByIssue(@Param('issueId') issueId: string) {
    return this.aiService.getPredictionsForIssue(issueId);
  }

  @Roles('ADMIN')
  @Get('admin-insights')
  async getAdminInsights() {
    return this.aiService.generateMonthlyAdminInsights();
  }
}
