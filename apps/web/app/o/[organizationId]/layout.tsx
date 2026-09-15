import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { WorkbenchShell } from '../../../components/workbench/workbench-shell';
import { createDatabase } from '../../../../../src/persistence/database';
import { organizations } from '../../../../../src/persistence/schema';
import { requireOrganizationContext } from '../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

export default async function OrganizationLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ organizationId: string }>;
}>) {
  const { organizationId } = await params;
  const session = await resolveRuntimeSession();
  if (session === null) redirect('/unauthorized');

  let context;
  try {
    context = requireOrganizationContext(session, organizationId);
  } catch {
    redirect('/unauthorized');
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    redirect('/unauthorized');
  }

  const database = createDatabase(databaseUrl);
  const organizationName = await (async () => {
    try {
      const organization = (
        await database.db
          .select({ name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, organizationId))
          .limit(1)
      ).at(0);

      if (organization === undefined) redirect('/unauthorized');
      return organization.name;
    } finally {
      await database.close();
    }
  })();

  return (
    <WorkbenchShell
      organizationId={organizationId}
      organizationName={organizationName}
      role={context.role}
    >
      {children}
    </WorkbenchShell>
  );
}
