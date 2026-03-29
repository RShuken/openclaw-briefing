/**
 * POST /api/trigger-now
 *
 * RSH-179 — "Work on now" trigger from briefing site
 *
 * When Ryan clicks "⚡ Work on now" on a ticket:
 *   1. Receives: issue_id (Linear), user_comment, attachments (optional base64 files)
 *   2. Enriches the Linear ticket with the comment + attachment summaries (same as /api/revise)
 *   3. Marks the ticket In Progress + reassessing label
 *   4. Fires a cron wake event to the OpenClaw gateway so the sprint agent picks it up immediately
 *   5. Posts a comment to Linear noting the manual trigger
 *
 * Attachments: base64-encoded files (images, PDFs, text) attached by Ryan in the modal.
 * Images are included as vision context in the LLM enrichment prompt.
 * Non-image files are summarized by name/type and appended as context.
 *
 * Gateway trigger: POST to OPENCLAW_GATEWAY_URL/api/trigger with the sprint message.
 * Falls back to a Linear comment + reassessing label if gateway is not configured.
 */

export const runtime = 'edge';

import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  corsOptionsResponse,
  logRequest,
} from '@/lib/api/response';

// Linear constants
const LINEAR_API = 'https://api.linear.app/graphql';
const REASSESSING_LABEL_ID = 'd25805d4-2f62-4d0c-99dc-abae42ccd649';
const IN_PROGRESS_STATE_ID = 'acaa99ad-281b-4fa1-9e40-24fe2052ceb9';

interface Attachment {
  name: string;
  type: string;
  data: string; // base64 data URL: "data:<mime>;base64,<data>"
}

interface TriggerNowBody {
  issue_id?: string;
  user_comment?: string;
  action?: string;
  attachments?: Attachment[];
}

async function linearQuery(query: string) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error('LINEAR_API_KEY not set');

  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`Linear API error: ${res.status}`);
  const data = await res.json() as { data?: unknown; errors?: { message: string }[] };
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data;
}

async function getIssue(id: string) {
  const data = await linearQuery(`{
    issue(id: "${id}") {
      id identifier title description
      state { name }
      labels { nodes { id name } }
      comments(last: 5) { nodes { body createdAt } }
    }
  }`) as {
    issue: {
      id: string;
      identifier: string;
      title: string;
      description: string | null;
      state: { name: string };
      labels: { nodes: { id: string; name: string }[] };
      comments: { nodes: { body: string; createdAt: string }[] };
    };
  };
  return data.issue;
}

/**
 * Enrich ticket description using Anthropic, optionally with image attachments.
 */
async function enrichWithAttachments(
  title: string,
  description: string | null,
  priorComments: string[],
  userComment: string,
  attachments: Attachment[]
): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    // No LLM — just append comment + attachment summary
    const attachSummary = attachments.length
      ? '\n\n**Attached files:**\n' + attachments.map(a => `- ${a.name} (${a.type})`).join('\n')
      : '';
    return [
      description || '',
      '',
      '---',
      "## Ryan's Work-On-Now Request",
      userComment,
      attachSummary,
    ].join('\n');
  }

  // Build Anthropic message content (supports vision for images)
  const imageAttachments = attachments.filter(a => a.type.startsWith('image/'));
  const nonImageAttachments = attachments.filter(a => !a.type.startsWith('image/'));

  const textPrompt = `You are helping improve a Linear ticket for an AI-agent software project.

TICKET TITLE: ${title}

ORIGINAL DESCRIPTION:
${description || '(no description)'}

PRIOR SPRINT COMMENTS:
${priorComments.length ? priorComments.join('\n\n---\n\n') : '(none)'}

RYAN'S FEEDBACK (work on this NOW — highest priority):
${userComment}
${nonImageAttachments.length ? `\nATTACHED FILES (non-image context):\n${nonImageAttachments.map(a => `- ${a.name} (${a.type})`).join('\n')}` : ''}
${imageAttachments.length ? `\nATTACHED IMAGES: ${imageAttachments.length} image(s) provided above for visual context.` : ''}

Rewrite the ticket description to be clearer, more actionable, and incorporate Ryan's feedback and any visual context from the attached images. Make it immediately executable — Ryan has triggered this for RIGHT NOW. Return ONLY the new description markdown, no preamble.`;

  // Build message content array
  type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

  const messageContent: ContentBlock[] = [];

  // Add images first (vision context)
  for (const img of imageAttachments) {
    const [header, base64Data] = img.data.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : img.type;
    messageContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: mimeType as string,
        data: base64Data,
      },
    });
  }

  messageContent.push({ type: 'text', text: textPrompt });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: imageAttachments.length > 0 ? 'claude-haiku-4-5' : 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: messageContent }],
    }),
  });

  if (!res.ok) {
    console.error('[TRIGGER-NOW] Anthropic error:', res.status);
    return [description || '', '', '---', "## Ryan's Work-On-Now Request", userComment].join('\n');
  }

  const json = await res.json() as { content: { type: string; text: string }[] };
  return json.content?.[0]?.text || description || '';
}

/**
 * Fire a wake event to the OpenClaw gateway so the sprint agent picks up
 * this ticket immediately in the current session.
 */
async function triggerGatewayWake(identifier: string, title: string, comment: string): Promise<boolean> {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL;
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;

  if (!gatewayUrl || !gatewayToken) {
    console.warn('[TRIGGER-NOW] OPENCLAW_GATEWAY_URL or OPENCLAW_GATEWAY_TOKEN not set — skipping gateway wake');
    return false;
  }

  const message = `[BRIEFING TRIGGER] Ryan manually triggered ${identifier} from the briefing site. Work on this now as the highest priority.\n\nTicket: ${title}\n\nRyan's note: ${comment}\n\nLinear: In Progress + reassessing label applied.`;

  try {
    const res = await fetch(`${gatewayUrl}/api/wake`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gatewayToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message, mode: 'now' }),
    });

    if (!res.ok) {
      console.error('[TRIGGER-NOW] Gateway wake failed:', res.status, await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error('[TRIGGER-NOW] Gateway wake error:', err);
    return false;
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => null) as TriggerNowBody | null;

    if (!body || !body.issue_id) {
      return errorResponse('issue_id is required', 400);
    }

    const { issue_id, user_comment = '', attachments = [] } = body;

    if (!user_comment.trim()) {
      return errorResponse('user_comment is required — tell the agent what to do', 400);
    }

    // Fetch current issue
    const issue = await getIssue(issue_id);

    // Get prior comments for context
    const priorComments = issue.comments.nodes.map((c) => c.body);

    // Enrich ticket with comment + attachments
    const enrichedDescription = await enrichWithAttachments(
      issue.title,
      issue.description,
      priorComments,
      user_comment,
      attachments
    );

    // Update Linear: enriched description + reassessing label + In Progress
    const existingLabelIds = issue.labels.nodes.map((l) => l.id);
    const newLabelIds = [...new Set([...existingLabelIds, REASSESSING_LABEL_ID])];

    await linearQuery(`
      mutation {
        issueUpdate(id: "${issue.id}", input: {
          description: ${JSON.stringify(enrichedDescription)},
          stateId: "${IN_PROGRESS_STATE_ID}",
          labelIds: ${JSON.stringify(newLabelIds)}
        }) { success }
      }
    `);

    // Attachment summary for Linear comment
    const attachmentSummary = attachments.length
      ? `\n\n**Attachments:** ${attachments.map(a => `\`${a.name}\``).join(', ')}`
      : '';

    // Add Linear comment
    const commentBody = `⚡ **Triggered via briefing site — work on NOW**

**Ryan's instruction:**
${user_comment}${attachmentSummary}

Ticket has been enriched, marked In Progress, and flagged reassessing.
${attachments.filter(a => a.type.startsWith('image/')).length > 0 ? `\n*${attachments.filter(a => a.type.startsWith('image/')).length} image(s) provided as visual context for the LLM enrichment.*` : ''}`;

    await linearQuery(`
      mutation {
        commentCreate(input: {
          issueId: "${issue.id}",
          body: ${JSON.stringify(commentBody)}
        }) { success }
      }
    `);

    // Fire gateway wake to trigger agent immediately
    const gatewayTriggered = await triggerGatewayWake(issue.identifier, issue.title, user_comment);

    logRequest('POST', '/api/trigger-now', 200, Date.now() - startTime, {
      issue: issue.identifier,
      attachments: attachments.length,
      gateway_triggered: gatewayTriggered,
    });

    return successResponse({
      success: true,
      identifier: issue.identifier,
      enriched_preview: enrichedDescription.substring(0, 200),
      gateway_triggered: gatewayTriggered,
      note: gatewayTriggered
        ? 'Agent triggered — working on it now. Check Sprint topic in Telegram.'
        : 'Ticket updated in Linear. Agent will pick it up at next sprint window (gateway wake not configured).',
    });

  } catch (error) {
    console.error('[TRIGGER-NOW ERROR]', error);
    logRequest('POST', '/api/trigger-now', 500, Date.now() - startTime, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse('Internal server error', 500);
  }
}
