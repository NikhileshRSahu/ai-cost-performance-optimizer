import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
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

  return (
    <>
      <nav aria-label="Organization workbench">
        <Link href={`/o/${organizationId}`}>Overview</Link>{' '}
        <span aria-label="Current role">{context.role}</span>
      </nav>
      {children}
    </>
  );
}
