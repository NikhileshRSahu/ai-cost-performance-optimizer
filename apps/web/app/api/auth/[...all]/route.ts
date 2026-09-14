import { toNextJsHandler } from 'better-auth/next-js';
import { getWebAuth } from '../../../../lib/auth';

export async function GET(request: Request): Promise<Response> {
  const handler = toNextJsHandler(getWebAuth());
  return handler.GET(request);
}

export async function POST(request: Request): Promise<Response> {
  const handler = toNextJsHandler(getWebAuth());
  return handler.POST(request);
}
