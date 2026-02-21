import { z } from 'zod';
import { tests } from './schema';

export const errorSchemas = {
  notFound: z.object({ message: z.string() }),
};

export const api = {
  tests: {
    list: {
      method: 'GET' as const,
      path: '/api/tests' as const,
      responses: {
        200: z.array(z.custom<typeof tests.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
