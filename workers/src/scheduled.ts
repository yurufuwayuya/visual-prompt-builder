/**
 * Cloudflare Workers Scheduled Handler
 * Handles cleanup of expired images from R2
 */

import type { Bindings } from './types';
import { cleanupExpiredImages } from './services/r2Storage';

export type Env = Bindings;

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    // Clean up expired images every day at 2 AM UTC
    console.log('[Scheduled] Starting cleanup of expired images');

    try {
      const deletedCount = await cleanupExpiredImages(env.IMAGE_BUCKET);
      console.log(`[Scheduled] Cleaned up ${deletedCount} expired images`);
    } catch (error) {
      console.error('[Scheduled] Error during cleanup:', error);
      // Don't throw here to prevent the worker from crashing
    }
  },
};
