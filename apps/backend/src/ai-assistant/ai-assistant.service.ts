import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIAssistantRepository } from './ai-assistant.repository';
import { AIAssistantTools } from './tools/ai-assistant-tools';
import { getSystemPrompt } from './prompts/system-prompts';
import { AuthenticatedUserContext, AssistantIntent } from './types/ai-assistant.types';

@Injectable()
export class AIAssistantService {
  private readonly openAiApiKey: string;

  constructor(
    private readonly repository: AIAssistantRepository,
    private readonly tools: AIAssistantTools,
    private readonly configService: ConfigService,
  ) {
    this.openAiApiKey = this.configService.get<string>('OPENAI_API_KEY') || process.env.OPENAI_API_KEY || '';
  }

  async createConversation(
    user: AuthenticatedUserContext,
    title?: string,
    contextEntity?: string,
    contextEntityId?: string,
    initialMessage?: string,
  ) {
    const conversation = await this.repository.createConversation(
      user.id,
      title,
      contextEntity,
      contextEntityId,
    );

    if (initialMessage) {
      await this.sendMessage(user, conversation.id, initialMessage, contextEntity, contextEntityId);
      return this.getConversationById(user, conversation.id);
    }

    return conversation;
  }

  async getUserConversations(user: AuthenticatedUserContext) {
    return this.repository.findUserConversations(user.id);
  }

  async getConversationById(user: AuthenticatedUserContext, conversationId: string) {
    const conversation = await this.repository.findConversationById(conversationId, user.id);
    if (!conversation) {
      throw new NotFoundException(`Conversation '${conversationId}' not found or access denied`);
    }
    return conversation;
  }

  async renameConversation(user: AuthenticatedUserContext, conversationId: string, title: string) {
    await this.getConversationById(user, conversationId);
    await this.repository.updateConversationTitle(conversationId, user.id, title);
    return { message: 'Conversation renamed successfully', title };
  }

  async deleteConversation(user: AuthenticatedUserContext, conversationId: string) {
    await this.getConversationById(user, conversationId);
    await this.repository.softDeleteConversation(conversationId, user.id);
    return { message: 'Conversation deleted successfully' };
  }

  async sendMessage(
    user: AuthenticatedUserContext,
    conversationId: string | undefined,
    userMessage: string,
    contextEntity?: string,
    contextEntityId?: string,
  ) {
    let activeConversationId: string;

    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      const newConv = await this.repository.createConversation(
        user.id,
        userMessage.slice(0, 35) + '...',
        contextEntity,
        contextEntityId,
      );
      activeConversationId = newConv.id;
    } else {
      activeConversationId = conversationId;
    }

    let conversation = await this.repository.findConversationById(activeConversationId, user.id);
    if (!conversation) {
      const newConv = await this.repository.createConversation(
        user.id,
        userMessage.slice(0, 35) + '...',
        contextEntity,
        contextEntityId,
      );
      activeConversationId = newConv.id;
      conversation = newConv;
    }

    // Save user message to database
    await this.repository.addMessage(activeConversationId, 'user', userMessage);

    // Re-fetch conversation messages
    const updatedConversation = await this.repository.findConversationById(activeConversationId, user.id);

    // Build Messages array
    const systemPrompt = getSystemPrompt(user);
    const messagesHistory: any[] = [
      { role: 'system', content: systemPrompt },
      ...(updatedConversation?.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let assistantResponseText = '';

    // If OpenAI API key is available and valid, call OpenAI chat completions
    const hasValidKey =
      this.openAiApiKey &&
      this.openAiApiKey.trim().length > 0 &&
      !this.openAiApiKey.includes('your_openai_api_key') &&
      !this.openAiApiKey.includes('your-actual');

    if (hasValidKey) {
      try {
        assistantResponseText = await this.callOpenAICompletions(user, messagesHistory);
      } catch (err: any) {
        console.warn('OpenAI API call failed or timed out. Falling back to internal engine:', err?.message || err);
        assistantResponseText = await this.executeInternalFallback(user, userMessage);
      }
    } else {
      // Fallback Engine
      assistantResponseText = await this.executeInternalFallback(user, userMessage);
    }

    // Save assistant message to database
    const assistantMsg = await this.repository.addMessage(activeConversationId, 'assistant', assistantResponseText);

    return {
      conversationId: activeConversationId,
      message: assistantMsg,
    };
  }

  /**
   * Invoke OpenAI Chat Completions API with Function Tool Calling
   */
  private async callOpenAICompletions(
    user: AuthenticatedUserContext,
    messages: any[],
  ): Promise<string> {
    const toolDefs = this.tools.getToolDefinitions(user);

    const payload = {
      model: 'gpt-4o-mini',
      messages,
      tools: toolDefs.length > 0 ? toolDefs : undefined,
      tool_choice: 'auto',
      temperature: 0.3,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openAiApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error('No completion choice returned from OpenAI');
    }

    const message = choice.message;

    // Check if model called any tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message);

      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function?.name;
        let args = {};
        try {
          args = JSON.parse(toolCall.function?.arguments || '{}');
        } catch (e) {
          args = {};
        }

        // Execute tool with RBAC check
        const toolResult = await this.tools.executeTool(functionName, args, user);

        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify(toolResult),
        });
      }

      // Second call to get final synthesized natural language response
      const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.openAiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.3,
        }),
      });

      if (secondResponse.ok) {
        const secondData = await secondResponse.json();
        return secondData.choices?.[0]?.message?.content || 'Task completed.';
      }
    }

    return message.content || 'I am here to assist you with campus infrastructure intelligence.';
  }

  /**
   * Rule-assisted Tool Fallback Engine if OpenAI API key is unconfigured
   */
  /**
   * Detect intent of user query
   */
  private detectIntent(msg: string): AssistantIntent {
    if (/(TICK-\d+|TKT-\d{4}-\d{4})/i.test(msg) || msg.includes('ticket detail') || msg.includes('issue detail')) {
      return AssistantIntent.ISSUE_DETAILS;
    }
    if (msg.includes('notification') || msg.includes('alert') || msg.includes('unread')) {
      return AssistantIntent.NOTIFICATION_QUERY;
    }
    if (
      msg.includes('analytics') ||
      msg.includes('summary') ||
      msg.includes('kpi') ||
      msg.includes('statistic') ||
      msg.includes('most open issues') ||
      msg.includes('most unresolved') ||
      msg.includes('repeatedly failing') ||
      msg.includes('resolved this month')
    ) {
      return AssistantIntent.CAMPUS_ANALYTICS;
    }
    if (msg.includes('task') || msg.includes('overdue') || msg.includes('my assignment') || msg.includes('work on first')) {
      return AssistantIntent.MAINTENANCE_TASKS;
    }
    if (msg.includes('vendor') || msg.includes('repair') || msg.includes('quotation') || msg.includes('invoice')) {
      return AssistantIntent.VENDOR_INFORMATION;
    }
    if (msg.includes('room') || msg.includes('classroom') || msg.includes('lab') || msg.includes('floor')) {
      return AssistantIntent.ROOM_INFORMATION;
    }
    if (msg.includes('asset') || msg.includes('equipment') || msg.includes('cctv') || msg.includes('ac') || msg.includes('outlet')) {
      return AssistantIntent.ASSET_SEARCH;
    }
    // General help & guidance queries (e.g. "How do I report a maintenance problem?")
    if (
      /(how (do|to|can) (i|we)? (report|submit|create)|how (do|to) scan|report (a|an|maintenance)|guidance|instructions|help)/i.test(
        msg,
      )
    ) {
      return AssistantIntent.GENERAL_HELP;
    }
    if (msg.includes('lost') || msg.includes('found') || msg.includes('item') || msg.includes('claim')) {
      return AssistantIntent.LOST_FOUND_SEARCH;
    }
    if (
      msg.includes('my issue') ||
      msg.includes('my report') ||
      msg.includes('unresolved') ||
      msg.includes('status of my') ||
      msg.includes('recent report') ||
      msg.includes('my last issue') ||
      msg.includes('where did i report') ||
      msg.includes('show my report')
    ) {
      return AssistantIntent.MY_ISSUES;
    }
    return AssistantIntent.UNKNOWN;
  }

  /**
   * Rule-assisted Intent Engine if OpenAI API key is unconfigured
   */
  private async executeInternalFallback(
    user: AuthenticatedUserContext,
    userMessage: string,
  ): Promise<string> {
    const msg = userMessage.toLowerCase().trim();
    const intent = this.detectIntent(msg);

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'OPEN':
          return '🟡 **OPEN**';
        case 'IN_PROGRESS':
          return '🔵 **IN PROGRESS**';
        case 'RESOLVED':
          return '✅ **RESOLVED**';
        case 'CLOSED':
          return '🔒 **CLOSED**';
        case 'REJECTED':
          return '❌ **REJECTED**';
        default:
          return `**${status}**`;
      }
    };

    switch (intent) {
      case AssistantIntent.ISSUE_DETAILS: {
        const ticketMatch = userMessage.match(/(TICK-\d+|TKT-\d{4}-\d{4})/i);
        const identifier = ticketMatch ? ticketMatch[0] : msg.split(' ').pop();
        if (identifier) {
          const details = await this.tools.executeTool('getIssueDetails', { identifier }, user);
          if (details && !details.error) {
            return (
              `### 🎫 Ticket Details: ${details.ticketNumber}\n` +
              `• **Title**: "${details.title}"\n` +
              `• **Status**: ${getStatusBadge(details.status)}\n` +
              `• **Priority**: **${details.priority}**\n` +
              `• **Location**: ${details.location}\n` +
              `• **Category**: ${details.category}\n` +
              `• **Asset**: ${details.assetName || 'N/A'}\n` +
              `• **Created Date**: ${new Date(details.createdAt).toLocaleDateString()}\n` +
              (details.description ? `\n*Description*: "${details.description}"` : '')
            );
          }
        }
        return "I couldn't find any matching records for that ticket identifier.";
      }

      case AssistantIntent.NOTIFICATION_QUERY: {
        const notifications = await this.tools.executeTool('getNotifications', {}, user);
        if (Array.isArray(notifications) && notifications.length > 0) {
          const list = notifications
            .map(
              (n: any) =>
                `• **${n.title}** (${new Date(n.createdAt).toLocaleDateString()})\n` +
                `  ${n.message}`,
            )
            .join('\n\n');
          return `### 🔔 Your Recent Notifications (${notifications.length})\n\n${list}`;
        }
        return "I couldn't find any matching records in your notifications.";
      }

      case AssistantIntent.CAMPUS_ANALYTICS: {
        const analytics = await this.tools.executeTool('getCampusAnalytics', {}, user);
        if (analytics && !analytics.error) {
          let output = `### 📊 Campus Infrastructure Operational Intelligence\n\n`;
          output += `• **Total Reported Issues**: ${analytics.totalIssues}\n`;
          output += `• **Active Unresolved Issues**: **${analytics.unresolvedIssues}**\n`;
          output += `• **Resolved Issues**: ${analytics.resolvedIssues} (${analytics.resolutionRate}% resolution rate)\n`;
          output += `• **Overdue Maintenance Tasks**: **${analytics.overdueTasks}**\n\n`;

          if (analytics.topBuildingWithMostIssues) {
            output += `🏢 **Building with Most Open Issues**: **${analytics.topBuildingWithMostIssues.name}** (${analytics.topBuildingWithMostIssues.unresolvedCount} active issues)\n\n`;
          }

          if (analytics.repeatedFailingAssets?.length > 0) {
            output += `⚠️ **Top Repeatedly Failing Assets**:\n`;
            analytics.repeatedFailingAssets.forEach((a: any) => {
              output += `• Tag **${a.assetTag}**: "${a.name}" — ${a.issueCount} reported failures (Status: ${a.status})\n`;
            });
            output += `\n`;
          }

          if (analytics.topPendingVendors?.length > 0) {
            output += `🏢 **Vendors with Pending Repairs**:\n`;
            analytics.topPendingVendors.forEach((v: any) => {
              output += `• **${v.companyName}**: ${v.pendingRepairs} pending repair job(s)\n`;
            });
          }

          return output;
        }

        // Non-admin request
        const summary = await this.tools.executeTool('getBuildingIssueSummary', {}, user);
        if (Array.isArray(summary) && summary.length > 0) {
          const list = summary
            .map((b: any) => `• **${b.name}** (${b.buildingCode}): **${b.activeUnresolvedIssues}** active issues`)
            .join('\n');
          return `### 🏫 Campus Building Active Issues Summary\n\n${list}`;
        }
        return "I couldn't find any matching records for campus analytics.";
      }

      case AssistantIntent.MAINTENANCE_TASKS: {
        const tasks = await this.tools.executeTool('getMyMaintenanceTasks', {}, user);
        if (Array.isArray(tasks) && tasks.length > 0) {
          // Sort by priority (CRITICAL/HIGH first)
          const priorityOrder: Record<string, number> = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
          tasks.sort((a: any, b: any) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));

          const list = tasks
            .map(
              (t: any) =>
                `• Task **${t.taskNumber}**: "${t.title}"\n` +
                `  - **Priority**: **${t.priority}** | **Status**: **${t.status}**\n` +
                `  - **Asset**: ${t.asset}${t.issueTicket ? ` | Ticket: ${t.issueTicket}` : ''}`,
            )
            .join('\n\n');
          return `### 🛠️ Your Assigned Maintenance Tasks (${tasks.length})\n\n${list}\n\n💡 *Recommendation: Prioritize CRITICAL and HIGH priority tasks first.*`;
        }
        return "I couldn't find any matching records for assigned maintenance tasks.";
      }

      case AssistantIntent.VENDOR_INFORMATION: {
        const info = await this.tools.executeTool('getVendorInformation', {}, user);
        if (info && !info.error && info.assignments?.length > 0) {
          const list = info.assignments
            .map(
              (a: any) =>
                `• Repair Task **${a.taskNumber || 'RPR'}**: ${a.companyName || 'Vendor'}\n` +
                `  - **Status**: **${a.status}** | Ticket: **${a.issueTicket || 'N/A'}**\n` +
                (a.contractAmount ? `  - **Contract Amount**: $${a.contractAmount}\n` : '') +
                (a.invoiceNumber ? `  - **Invoice**: ${a.invoiceNumber} ($${a.invoiceAmount || 0}) — Payment: ${a.paymentStatus}` : ''),
            )
            .join('\n\n');
          return `### 🏢 Vendor Repair Assignments & Billing (${info.totalAssignments} Total — ${info.pendingRepairsCount} Pending)\n\n${list}`;
        }
        return "I couldn't find any matching records for vendor repairs or invoices.";
      }

      case AssistantIntent.ROOM_INFORMATION: {
        const room = await this.tools.executeTool('getRoomInformation', { query: msg }, user);
        if (room && !room.error) {
          let output = `### 🚪 Room Details: ${room.building} — Room ${room.roomNumber}\n`;
          output += `• **Name**: ${room.name}\n`;
          output += `• **Floor**: Floor ${room.floorNumber || 1}\n`;
          output += `• **Type**: ${room.type}\n`;
          output += `• **Capacity**: ${room.capacity || 'N/A'} persons\n`;
          if (room.assets?.length > 0) {
            output += `\n**Assets Installed (${room.assetCount})**:\n`;
            room.assets.forEach((a: any) => {
              output += `• [${a.assetTag}] ${a.name} — Status: ${a.status}\n`;
            });
          }
          return output;
        }
        return `I couldn't find any matching records for room query "${userMessage}".`;
      }

      case AssistantIntent.ASSET_SEARCH: {
        const assetTag = msg.split(' ').pop();
        const asset = await this.tools.executeTool('getAssetDetails', { assetTag }, user);
        if (asset && !asset.error) {
          return (
            `### 📦 Asset Specifications: ${asset.name}\n` +
            `• **Asset Tag**: **${asset.assetTag}**\n` +
            `• **Category**: ${asset.category}\n` +
            `• **Status**: **${asset.status}**\n` +
            `• **Location**: ${asset.location}\n` +
            `• **Manufacturer/Model**: ${asset.manufacturer || 'N/A'} ${asset.modelNumber || ''}\n` +
            `• **Serial Number**: ${asset.serialNumber || 'N/A'}`
          );
        }
        return `I couldn't find any matching records for asset query "${userMessage}".`;
      }

      case AssistantIntent.LOST_FOUND_SEARCH: {
        let typeFilter: string | undefined = undefined;
        if (msg.includes('lost') && !msg.includes('found')) {
          typeFilter = 'LOST';
        } else if (msg.includes('found') && !msg.includes('lost')) {
          typeFilter = 'FOUND';
        }

        const commonItems = [
          'wallet', 'keys', 'key', 'phone', 'iphone', 'laptop', 'macbook',
          'charger', 'bag', 'backpack', 'id card', 'card', 'watch', 'jacket',
          'bottle', 'glasses', 'umbrella', 'calculator', 'notebook', 'airpods',
        ];
        const foundKeyword = commonItems.find((k) => msg.includes(k));

        const items = await this.tools.executeTool(
          'getLostAndFoundItems',
          { type: typeFilter, query: foundKeyword },
          user,
        );

        if (Array.isArray(items) && items.length > 0) {
          const list = items
            .map(
              (item: any) =>
                `• **[${item.type}]** "${item.title}" (${item.category || 'General'})\n` +
                `  📍 Location: ${item.location} | Date: ${new Date(item.dateOccurred).toLocaleDateString()}`,
            )
            .join('\n\n');
          return `### 🔍 Active Lost & Found Items (${items.length})\n\n${list}\n\n💡 *Tip: Go to Lost & Found page to submit a claim request.*`;
        }
        return "I couldn't find any matching records in Lost & Found.";
      }

      case AssistantIntent.GENERAL_HELP: {
        if (msg.includes('qr')) {
          const info = await this.tools.executeTool('getCampusInformation', { topic: 'scan_qr' }, user);
          return `### 📱 ${info.title}\n\n` + info.steps.join('\n');
        }
        const info = await this.tools.executeTool('getCampusInformation', { topic: 'report_issue' }, user);
        return `### 📝 ${info.title}\n\n` + info.steps.join('\n');
      }

      case AssistantIntent.MY_ISSUES: {
        const isUnresolved = msg.includes('unresolved') || msg.includes('open') || msg.includes('pending') || msg.includes('in progress');
        const isResolved = msg.includes('resolved') || msg.includes('closed') || msg.includes('completed');

        if (isUnresolved) {
          const issues = await this.tools.executeTool('getMyIssues', { unresolved: true, limit: 10 }, user);
          if (Array.isArray(issues) && issues.length > 0) {
            const list = issues
              .map(
                (i: any) =>
                  `• Ticket **${i.ticketNumber}**: "${i.title}" — ${getStatusBadge(i.status)}\n` +
                  `  📍 *Location*: ${i.location}`,
              )
              .join('\n\n');
            return `### 📋 Your Unresolved Issue Reports (${issues.length} Active)\n\n${list}\n\n💡 *Tip: Mention a ticket number (e.g. "${issues[0].ticketNumber}") to view detailed updates.*`;
          }
          return '🎉 **Great news!** You currently have no unresolved or open reported issues. All your reports are resolved or closed.';
        }

        if (isResolved) {
          const allIssues = await this.tools.executeTool('getMyIssues', { limit: 10 }, user);
          const resolved = Array.isArray(allIssues)
            ? allIssues.filter((i: any) => i.status === 'RESOLVED' || i.status === 'CLOSED')
            : [];
          if (resolved.length > 0) {
            const list = resolved
              .map(
                (i: any) =>
                  `• Ticket **${i.ticketNumber}**: "${i.title}" — ${getStatusBadge(i.status)}\n` +
                  `  📍 *Location*: ${i.location}`,
              )
              .join('\n\n');
            return `### ✅ Your Resolved & Closed Reports (${resolved.length})\n\n${list}`;
          }
          return "I couldn't find any matching records in your resolved or closed issue history.";
        }

        // All reported issues
        const issues = await this.tools.executeTool('getMyIssues', { limit: 10 }, user);
        if (Array.isArray(issues) && issues.length > 0) {
          const unresolvedCount = issues.filter((i: any) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
          const list = issues
            .map(
              (i: any) =>
                `• Ticket **${i.ticketNumber}**: "${i.title}" — ${getStatusBadge(i.status)}\n` +
                `  📍 *Location*: ${i.location}`,
            )
            .join('\n\n');
          return `### 📋 Your Reported Issues (${issues.length} Total — ${unresolvedCount} Active)\n\n${list}\n\n💡 *Tip: Ask "Show my unresolved reports" to view active tickets.*`;
        }
        return 'You currently have no reported issues. Need to submit a new report? Scan a room QR code or click "Report Issue".';
      }

      case AssistantIntent.UNKNOWN:
      default: {
        return (
          `Hello **${user.firstName || user.email}**! 👋 I am your Campus Infrastructure AI Assistant.\n\n` +
          `I can help you with:\n` +
          `• **Issue Reports**: Ask *"Show my unresolved reports"* or *"Details for TICK-134114"*\n` +
          `• **How-to Guides**: Ask *"How do I report a maintenance problem?"*\n` +
          `• **Maintenance & Tasks**: Ask *"Show my assigned tasks"*\n` +
          `• **Campus Infrastructure**: Ask *"Which building has the most open issues?"*\n` +
          `• **Lost & Found**: Ask *"Are there any lost items?"*\n\n` +
          `How can I assist you right now?`
        );
      }
    }
  }
}
