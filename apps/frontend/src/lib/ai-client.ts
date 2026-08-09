import { apiRequest } from './auth-client';

export interface AiPredictionItem {
  id: string;
  issueReportId?: string;
  assetId?: string;
  predictionType:
    | 'FAILURE_RISK'
    | 'MAINTENANCE_NEEDED'
    | 'PRIORITY_RECOMMENDATION'
    | 'COST_ESTIMATE'
    | 'ISSUE_CATEGORIZATION'
    | 'DUPLICATE_DETECTION'
    | 'MAINTENANCE_SUMMARY'
    | 'MONTHLY_INSIGHTS';
  confidenceScore: number;
  predictedValue: string;
  recommendation?: string;
  modelMetadata?: any;
  createdAt: string;
}

export interface LiveTextAnalysisResponse {
  categorization: {
    categoryName: string;
    code: string;
    confidenceScore: number;
    reasoning: string;
  };
  priority: {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidenceScore: number;
    reasoning: string;
  };
  duplicateDetection: {
    isDuplicate: boolean;
    duplicateTicketNumber?: string;
    duplicateIssueId?: string;
    confidenceScore: number;
    reasoning: string;
  };
}

export interface MonthlyInsightsResponse {
  executiveSummary: string;
  topRiskBuilding: string;
  topFailureCategory: string;
  recommendedActions: string[];
  generatedAt: string;
}

export async function analyzeIssueText(payload: {
  title: string;
  description: string;
  buildingId?: string;
  roomId?: string;
  assetId?: string;
}): Promise<LiveTextAnalysisResponse> {
  return apiRequest<LiveTextAnalysisResponse>('/ai/analyze-text', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function triggerIssueAiAnalysis(issueId: string): Promise<any> {
  return apiRequest<any>(`/ai/analyze-issue/${issueId}`, {
    method: 'POST',
  });
}

export async function fetchIssuePredictions(issueId: string): Promise<AiPredictionItem[]> {
  return apiRequest<AiPredictionItem[]>(`/ai/predictions/issue/${issueId}`);
}

export async function fetchMonthlyAdminInsights(): Promise<MonthlyInsightsResponse> {
  return apiRequest<MonthlyInsightsResponse>('/ai/admin-insights');
}
