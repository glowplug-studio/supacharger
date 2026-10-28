import { z } from 'zod';

// Match the private SQL extension hook. Core validates and writes atomically.
export const accountProfileExtensionSchema = z.object({}).strict();
