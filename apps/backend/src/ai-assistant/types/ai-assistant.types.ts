export interface AuthenticatedUserContext {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: {
    id: string;
    name: string;
  };
}

export enum AssistantIntent {
  ISSUE_SEARCH = 'ISSUE_SEARCH',
  ISSUE_DETAILS = 'ISSUE_DETAILS',
  MY_ISSUES = 'MY_ISSUES',
  MAINTENANCE_TASKS = 'MAINTENANCE_TASKS',
  ASSET_SEARCH = 'ASSET_SEARCH',
  BUILDING_INFORMATION = 'BUILDING_INFORMATION',
  ROOM_INFORMATION = 'ROOM_INFORMATION',
  VENDOR_INFORMATION = 'VENDOR_INFORMATION',
  LOST_FOUND_SEARCH = 'LOST_FOUND_SEARCH',
  NOTIFICATION_QUERY = 'NOTIFICATION_QUERY',
  CAMPUS_ANALYTICS = 'CAMPUS_ANALYTICS',
  GENERAL_HELP = 'GENERAL_HELP',
  NAVIGATION = 'NAVIGATION',
  UNKNOWN = 'UNKNOWN',
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt?: Date;
  toolCalls?: any;
}

export interface ToolExecutionParams {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}
