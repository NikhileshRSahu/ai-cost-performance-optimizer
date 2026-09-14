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
    <div className="org-workbench">
      <aside className="workbench-sidebar">
        <div>
          <p className="sidebar-kicker">Optimization workbench</p>
          <p className="sidebar-org">{organizationId}</p>
          <span className="role-chip" aria-label="Current role">
            {context.role}
          </span>
        </div>
        <nav aria-label="Organization workbench">
          <Link href={`/o/${organizationId}`}>Overview</Link>
          <Link href={`/o/${organizationId}/demo`}>Guided demo</Link>
          <Link href={`/o/${organizationId}/import`}>Import</Link>
          <Link href={`/o/${organizationId}/history`}>AI history</Link>
          <Link href={`/o/${organizationId}/workloads`}>Workloads</Link>
          <Link href={`/o/${organizationId}/benchmark`}>Benchmark</Link>
          <Link href={`/o/${organizationId}/telemetry`}>Telemetry</Link>
          <Link href={`/o/${organizationId}/data`}>Data &amp; privacy</Link>
        </nav>
        <p className="sidebar-note">
          Savings stay separate as potential, tested, and verified evidence.
        </p>
      </aside>
      <div className="workbench-content">{children}</div>
    </div>
  );
}
