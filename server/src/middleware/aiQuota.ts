import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

// ------ Tunable limits ------
// Lower these if costs creep up; raise if you trust the audience more.
export const AI_CALLS_PER_USER_PER_WINDOW = 2;
export const AI_QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Per-IP daily cap as a second layer (catches bots that register many accounts)
export const AI_CALLS_PER_IP_PER_WINDOW = 10;

// ----------------------------

const ipUsage = new Map<string, number[]>(); // ip → array of timestamps

function getIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function withinWindow(timestamps: number[]): number[] {
  const cutoff = Date.now() - AI_QUOTA_WINDOW_MS;
  return timestamps.filter((t) => t >= cutoff);
}

/**
 * checkAiQuota — enforces per-user and per-IP rolling 24h limits on AI routes.
 * Run after requireAuth. Does NOT record usage; call recordAiUsage() only after
 * the AI call has succeeded (so failed calls don't burn quota).
 */
export async function checkAiQuota(req: Request, res: Response, next: NextFunction) {
  try {
    // Per-IP check (in-memory; resets on server restart)
    const ip = getIp(req);
    const ipHits = withinWindow(ipUsage.get(ip) || []);
    ipUsage.set(ip, ipHits);
    if (ipHits.length >= AI_CALLS_PER_IP_PER_WINDOW) {
      const oldest = ipHits[0];
      const nextAvailableAt = new Date(oldest + AI_QUOTA_WINDOW_MS);
      return res.status(429).json({
        error: 'AI quota exceeded for this network. Please try again later.',
        scope: 'ip',
        limit: AI_CALLS_PER_IP_PER_WINDOW,
        windowHours: AI_QUOTA_WINDOW_MS / 3_600_000,
        nextAvailableAt,
      });
    }

    // Per-user check (persisted in MongoDB)
    const userId = req.user!.id;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const userHits = withinWindow(
      (user.aiCallHistory || []).map((d) => new Date(d).getTime())
    );

    if (userHits.length >= AI_CALLS_PER_USER_PER_WINDOW) {
      const oldest = userHits[0];
      const nextAvailableAt = new Date(oldest + AI_QUOTA_WINDOW_MS);
      return res.status(429).json({
        error: `AI features are limited to ${AI_CALLS_PER_USER_PER_WINDOW} per ${AI_QUOTA_WINDOW_MS / 3_600_000} hours on this demo.`,
        scope: 'user',
        limit: AI_CALLS_PER_USER_PER_WINDOW,
        windowHours: AI_QUOTA_WINDOW_MS / 3_600_000,
        used: userHits.length,
        nextAvailableAt,
      });
    }

    // Stash for use in recordAiUsage
    res.locals.userHits = userHits;
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * recordAiUsage — call AFTER a successful AI call to increment both user and IP counters.
 */
export async function recordAiUsage(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const trimmed = (res.locals.userHits as number[] | undefined) || [];
    const nextHistory = [...trimmed.map((t) => new Date(t)), now];
    await User.findByIdAndUpdate(userId, { aiCallHistory: nextHistory });

    const ip = getIp(req);
    const ipHits = withinWindow(ipUsage.get(ip) || []);
    ipHits.push(now.getTime());
    ipUsage.set(ip, ipHits);
  } catch {
    // Best-effort; don't fail the response if recording the quota fails
  }
}

/** For tests — wipe in-memory IP tracking between runs */
export function _resetIpQuotaForTests() {
  ipUsage.clear();
}
