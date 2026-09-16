import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../src/persistence/database';
import { organizations } from '../../../../src/persistence/schema';
import { resolveRuntimeSession } from '../../lib/runtime-session';

export default async function StartPage() {
  const session = await resolveRuntimeSession();
  if (session === null) redirect('/login');

  const membership = session.memberships.at(0);
  if (membership === undefined) redirect('/unauthorized');

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    const organization = (
      await database.db
        .select({
          onboardingCompletedAt: organizations.onboardingCompletedAt,
        })
        .from(organizations)
        .where(eq(organizations.id, membership.organizationId))
        .limit(1)
    ).at(0);

    if (
      organization !== undefined &&
      organization.onboardingCompletedAt === null &&
      membership.role === 'OWNER'
    ) {
      redirect('/o/' + membership.organizationId + '/settings?onboarding=true');
    }
  } finally {
    await database.close();
  }

  redirect('/o/' + membership.organizationId);
}
