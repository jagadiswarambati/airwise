import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { handleAirCore } from './api/air';
import { handleGeocodeCore } from './api/geocode';
import { handleHealthCore } from './api/health';
import { handlePlanCore } from './api/plan';

import type { IncomingMessage } from 'node:http';

function extractHeaders(req: {
  headers: Record<string, string | string[] | undefined>;
}): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (typeof val === 'string') {
      headers[key.toLowerCase()] = val;
    } else if (Array.isArray(val) && val.length > 0) {
      headers[key.toLowerCase()] = val[0];
    }
  }
  return headers;
}

async function routeApiRequest(
  pathname: string,
  req: IncomingMessage,
  queryParams: Record<string, string>,
  headers: Record<string, string>,
): Promise<{ status: number; headers: Record<string, string>; body: unknown } | null> {
  if (pathname === '/api/health') {
    return handleHealthCore(headers, req.method);
  }
  if (pathname === '/api/geocode') {
    return handleGeocodeCore(queryParams, headers, req.method);
  }
  if (pathname === '/api/air') {
    return handleAirCore(queryParams, headers, req.method);
  }
  if (pathname === '/api/plan') {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes <= 16384) {
        chunks.push(chunk);
      }
    });
    await new Promise<void>((resolve) => req.on('end', () => resolve()));
    const rawBody = Buffer.concat(chunks).toString('utf-8');
    return handlePlanCore(rawBody, headers, req.method, totalBytes);
  }
  return null;
}

function apiDevAndPreviewPlugin(): Plugin {
  return {
    name: 'api-dev-and-preview-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const [pathname, search] = url.split('?');

        if (!pathname.startsWith('/api/')) {
          return next();
        }

        try {
          const queryParams: Record<string, string> = {};
          if (search) {
            const sp = new URLSearchParams(search);
            sp.forEach((val, key) => {
              queryParams[key] = val;
            });
          }

          const headers = extractHeaders(req);
          const response = await routeApiRequest(pathname, req, queryParams, headers);

          if (!response) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({ error: { code: 'NotFound', message: 'API endpoint not found' } }),
            );
            return;
          }

          res.statusCode = response.status;
          for (const [k, v] of Object.entries(response.headers)) {
            res.setHeader(k, v);
          }
          res.end(JSON.stringify(response.body));
        } catch (_err: unknown) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({ error: { code: 'InternalError', message: 'Internal server error' } }),
          );
        }
      });
    },
    configurePreviewServer(server) {
      try {
        const vercelPath = path.resolve(__dirname, 'vercel.json');
        if (fs.existsSync(vercelPath)) {
          const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
          const headerRules = vercelConfig.headers || [];

          server.middlewares.use((_req, res, next) => {
            for (const rule of headerRules) {
              if (rule.headers && Array.isArray(rule.headers)) {
                for (const header of rule.headers) {
                  res.setHeader(header.key, header.value);
                }
              }
            }
            next();
          });
        }
      } catch {
        // Fallback gracefully
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevAndPreviewPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
