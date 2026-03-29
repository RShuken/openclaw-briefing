/**
 * POST /api/merge-pr
 *
 * Called when Ryan clicks "Done" on a ticket in the briefing dashboard.
 * Merges the associated PR into `dev` via GitHub API, then posts a comment.
 *
 * Body: { pr_number: number, pr_repo: string, ticket_id: string }
 * pr_repo format: "RShuken/openclaw-briefing" (owner/repo)
 */

export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { successResponse, errorResponse, corsOptionsResponse, logRequest } from '@/lib/api/response';

const GITHUB_API = 'https://api.github.com';

async function ghRequest(path: string, method = 'GET', body?: unknown) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not configured');

  const res = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = { _raw: text }; }

  if (!res.ok) {
    const msg = (json as { message?: string })?.message || text;
    throw new Error(`GitHub ${method} ${path} → ${res.status}: ${msg}`);
  }
  return json;
}

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json().catch(() => null) as {
      pr_number?: number;
      pr_repo?: string;
      ticket_id?: string;
    } | null;

    if (!body?.pr_number || !body?.pr_repo) {
      return errorResponse('pr_number and pr_repo are required', 400);
    }

    const { pr_number, pr_repo, ticket_id } = body;

    // Verify PR exists and is open
    const pr = await ghRequest(`/repos/${pr_repo}/pulls/${pr_number}`) as {
      state: string;
      title: string;
      head: { sha: string };
      base: { ref: string };
      merged: boolean;
    };

    if (pr.state !== 'open') {
      if (pr.merged) {
        return successResponse({ success: true, note: 'PR already merged', pr_number });
      }
      return errorResponse(`PR #${pr_number} is ${pr.state}, not open`, 400);
    }

    // Merge into dev
    const mergeResult = await ghRequest(`/repos/${pr_repo}/pulls/${pr_number}/merge`, 'PUT', {
      commit_title: `✅ Approved & merged via briefing dashboard — ${ticket_id || `PR #${pr_number}`}`,
      commit_message: `Merged by Ryan via the OpenClaw briefing dashboard Done button.\n\nTicket: ${ticket_id || 'n/a'}`,
      merge_method: 'squash',
    }) as { merged: boolean; message: string; sha: string };

    if (!mergeResult.merged) {
      throw new Error(mergeResult.message || 'Merge failed');
    }

    // Post comment on PR
    await ghRequest(`/repos/${pr_repo}/issues/${pr_number}/comments`, 'POST', {
      body: `✅ **Approved via briefing dashboard by Ryan**\n\nThis PR was merged to \`dev\` using the Done button on the OpenClaw morning briefing site.\n\nTicket: \`${ticket_id || 'n/a'}\`\nMerge SHA: \`${mergeResult.sha?.slice(0, 7) || 'n/a'}\``,
    });

    logRequest('POST', '/api/merge-pr', 200, Date.now() - startTime, {
      pr: `${pr_repo}#${pr_number}`,
      ticket: ticket_id,
      sha: mergeResult.sha?.slice(0, 7),
    });

    return successResponse({
      success: true,
      pr_number,
      pr_repo,
      merge_sha: mergeResult.sha,
      note: `PR #${pr_number} merged to dev`,
    });

  } catch (error) {
    console.error('[MERGE-PR ERROR]', error);
    logRequest('POST', '/api/merge-pr', 500, Date.now() - startTime, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
