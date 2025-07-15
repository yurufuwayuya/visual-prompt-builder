// Development environment setup for wrangler
// This file loads .env and maps REPLICATE_API_KEY to IMAGE_API_KEY

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from parent directory
config({ path: resolve(process.cwd(), '../.env') });

// Map REPLICATE_API_KEY to IMAGE_API_KEY
if (process.env.REPLICATE_API_KEY && !process.env.IMAGE_API_KEY) {
  process.env.IMAGE_API_KEY = process.env.REPLICATE_API_KEY;
  // console.log('✅ Mapped REPLICATE_API_KEY to IMAGE_API_KEY');
}

// Export for use in wrangler
export default {};
