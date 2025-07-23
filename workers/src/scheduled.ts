/**
 * Cloudflare Workers Scheduled Handler
 * Handles cleanup of expired images from R2
 */

import type { Bindings } from './types';
import { cleanupExpiredImages } from './services/r2Storage';
import { createLogger } from './utils/logger';

export type Env = Bindings;

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    // Clean up expired images every day at 2 AM UTC
    const scheduledLogger = createLogger({ prefix: 'Scheduled', env });
    scheduledLogger.info('Starting cleanup of expired images');

    try {
      const deletedCount = await cleanupExpiredImages(env.IMAGE_BUCKET);
      scheduledLogger.info(`Cleaned up ${deletedCount} expired images`);
    } catch (error) {
      scheduledLogger.error('Error during cleanup:', error);
      // Don't throw here to prevent the worker from crashing
    }
  },
};
