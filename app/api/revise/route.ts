/**
 * POST /api/revise
 *
 * RSH-187 — Ticket Revise workflow
 *
 * When Ryan clicks "Revise" on a ticket in the briefing site:
 *   1. Receives: issue_id (Linear), user_comment, action (revise|defer|done)
 *   2. For "revise": calls Anthropic API to enrich the ticket description
 *   3. Posts enriched description back to Linear
 *   4. Adds "reassessing" label so nightly sprint picks it up
 *   5. Posts a comment showing before/after
 *
 * For "defer": adds a Deferred label and comment, moves to Backlog state
 * For "done": marks the ticket Done in Linear
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
const DONE_STATE_ID = 'a70179f0-f4a3-4b70-9dc3-34e22abf4309';
const BACKLOG_STATE_ID = '16f1cbfd-ae55-4d75-808f-aa9e96af1d4c';
const IN_PROGRESS_STATE_ID = 'acaa99ad-281b-4fa1-9e40-24fe2052ceb9';

async function linearQuery(query: string) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error('LINEAR_API_KEY not set');

  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
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
  }`) as { issue: {
    id: string; identifier: string; title: string; description: string | null;
    state: { name: string };
    labels: { nodes: { id: string; name: string }[] };
    comments: { nodes: { body: string; createdAt: string }[] };
  } };
  return data.issue;
}

async function enrichTicket(
  title: string,
  description: string | null,
  priorComments: string[],
  userComment: string
): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    // Fallback: just append the comment if no LLM available
    return [
      description || '',
      '',
      '---',
      '## Ryan\'s Revision Request',
      userComment,
    ].join('\n');
  }

  const prompt = `You are helping improve a Linear ticket for a software project.

TICKET TITLE: ${title}

ORIGINAL DESCRIPTION:
${description || '(no description)'}

PRIOR SPRINT COMMENTS:
${priorComments.length ? priorComments.join('\n\n---\n\n') : '(none)'}

RYAN'S NEW FEEDBACK:
${userComment}

Rewrite the ticket description to be clearer, more actionable, and incorporate Ryan's feedback. Make it noticeably better — not just appended. Return ONLY the new description markdown, no preamble.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error('[REVISE] Anthropic error:', res.status);
    return [description || '', '', '---', '## Ryan\'s Revision Request', userComment].join('\n');
  }

  const json = await res.json() as { content: { type: string; text: string }[] };
  return json.content?.[0]?.text || description || '';
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => null) as {
      issue_id?: string;
      user_comment?: string;
      action?: string;
      // RSH-179: optional file attachments (base64 data URLs from briefing modal)
      attachments?: { name: string; type: string; data: string }[];
    } | null;

    if (!body || !body.issue_id) {
      return errorResponse('issue_id is required', 400);
    }

    const { issue_id, user_comment = '', action = 'revise', attachments = [] } = body;

    if (!['revise', 'defer', 'done'].includes(action)) {
      return errorResponse('action must be one of: revise, defer, done', 400);
    }

    // Fetch current issue from Linear
    const issue = await getIssue(issue_id);

    if (action === 'done') {
      // Mark ticket Done
      await linearQuery(`
        mutation {
          issueUpdate(id: "${issue.id}", input: { stateId: "${DONE_STATE_ID}" }) {
            success
          }
        }
      `);

      if (user_comment) {
        await linearQuery(`
          mutation {
            commentCreate(input: {
              issueId: "${issue.id}",
              body: "✅ Marked done via briefing site.\\n\\n${user_comment.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
            }) { success }
          }
        `);
      }

      logRequest('POST', '/api/revise', 200, Date.now() - startTime, { action: 'done', issue: issue.identifier });
      return successResponse({ success: true, action: 'done', identifier: issue.identifier });
    }

    if (action === 'defer') {
      // Move to Backlog + comment
      await linearQuery(`
        mutation {
          issueUpdate(id: "${issue.id}", input: { stateId: "${BACKLOG_STATE_ID}" }) { success }
        }
      `);

      const comment = user_comment
        ? `⏸️ Deferred via briefing site.\\n\\nRyan's note: ${user_comment.replace(/"/g, '\\"').replace(/\n/g, '\\n')}`
        : `⏸️ Deferred via briefing site. Will not run tonight.`;

      await linearQuery(`
        mutation {
          commentCreate(input: { issueId: "${issue.id}", body: "${comment}" }) { success }
        }
      `);

      logRequest('POST', '/api/revise', 200, Date.now() - startTime, { action: 'defer', issue: issue.identifier });
      return successResponse({ success: true, action: 'defer', identifier: issue.identifier });
    }

    // action === 'revise'
    if (!user_comment.trim()) {
      return errorResponse('user_comment is required for revise action', 400);
    }

    // Get prior sprint comments
    const priorComments = issue.comments.nodes.map((c) => c.body);

    // Append attachment summary to comment if files were attached
    const attachmentContext = attachments.length
      ? '\n\n**Attached files:**\n' + attachments.map(a => `- ${a.name} (${a.type})`).join('\n')
      : '';
    const enrichedComment = user_comment + attachmentContext;

    // Enrich the ticket using LLM
    const enrichedDescription = await enrichTicket(
      issue.title,
      issue.description,
      priorComments,
      enrichedComment
    );

    // Update Linear: new description + reassessing label + move to In Progress
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

    // Add before/after comment
    const originalSnippet = (issue.description || '(none)').substring(0, 300);
    const enrichedSnippet = enrichedDescription.substring(0, 300);
    const attachSummary = attachments.length
      ? `\n\n**Attached files:** ${attachments.map(a => `\`${a.name}\``).join(', ')}`
      : '';
    const commentBody = `🔄 **Ticket revised via briefing site**

**Ryan's feedback:**
${user_comment}${attachSummary}

**Original description (first 300 chars):**
${originalSnippet}${(issue.description || '').length > 300 ? '…' : ''}

**Enriched description (first 300 chars):**
${enrichedSnippet}${enrichedDescription.length > 300 ? '…' : ''}

*Ticket is now marked In Progress + reassessing — will be picked up tonight's sprint.*`;

    await linearQuery(`
      mutation {
        commentCreate(input: {
          issueId: "${issue.id}",
          body: ${JSON.stringify(commentBody)}
        }) { success }
      }
    `);

    logRequest('POST', '/api/revise', 200, Date.now() - startTime, { action: 'revise', issue: issue.identifier });
    return successResponse({
      success: true,
      action: 'revise',
      identifier: issue.identifier,
      enriched_preview: enrichedDescription.substring(0, 200),
    });

  } catch (error) {
    console.error('[REVISE ERROR]', error);
    logRequest('POST', '/api/revise', 500, Date.now() - startTime, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse('Internal server error', 500);
  }
}
