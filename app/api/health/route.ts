export async function GET() {
  return Response.json({ ok: true, service: 'evalomics', evidenceModel: ['observed','potential','tested','verified'] });
}
