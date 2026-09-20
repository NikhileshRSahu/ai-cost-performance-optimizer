import { createHash } from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { createDatabase } from '@/backend/persistence/database';
import { memberships, organizations, users } from '@/backend/persistence/schema';
import type { AuthenticatedSession } from '@/backend/workbench/authz';

export type RuntimeWorkspace = Readonly<{
  userId:string;
  email:string;
  name:string;
  organizationId:string;
  organizationName:string;
  role:'OWNER'|'OPERATOR'|'VIEWER';
  onboardingCompleted:boolean;
  session:AuthenticatedSession;
  availableWorkspaces:readonly Readonly<{organizationId:string;organizationName:string;role:'OWNER'|'OPERATOR'|'VIEWER'}>[];
}>;

function stableId(prefix:'usr'|'org',value:string){
  return prefix+'_'+createHash('sha256').update(value).digest('hex').slice(0,24);
}
function databaseUrl(){
  const value=process.env.DATABASE_URL?.trim();
  if(!value) throw new Error('DATABASE_URL_REQUIRED');
  return value;
}

async function resolveRuntimeWorkspaceUsing(database:ReturnType<typeof createDatabase>):Promise<RuntimeWorkspace|null>{
  const webSession=await auth();
  const email=webSession?.user?.email?.trim().toLowerCase();
  if(!email) return null;
  const name=webSession?.user?.name?.trim() || email;
  const providerSubject=(webSession?.user as ({providerSubject?:string} & Record<string,unknown>) | undefined)?.providerSubject?.trim() || email;

  return database.db.transaction(async(tx)=>{
    let user=(await tx.select().from(users).where(eq(users.email,email)).limit(1)).at(0);
    if(!user){
      const userId=stableId('usr','authjs/google\n'+providerSubject);
      await tx.insert(users).values({id:userId,email,authProvider:'authjs/google',authSubject:providerSubject}).onConflictDoNothing();
      user=(await tx.select().from(users).where(eq(users.email,email)).limit(1)).at(0);
    }
    if(!user) throw new Error('USER_PROVISION_FAILED');

    let memberRows=await tx.select({
      organizationId:memberships.organizationId,role:memberships.role
    }).from(memberships).where(eq(memberships.userId,user.id)).orderBy(memberships.createdAt);

    if(memberRows.length===0){
      const organizationId=stableId('org',user.id+'\nprimary-workspace');
      await tx.insert(organizations).values({
        id:organizationId,name:'My AI Workspace',reportingCurrency:'USD',
        timezone:'UTC',materialityTarget:'10',isDemo:false
      }).onConflictDoNothing();
      await tx.insert(memberships).values({organizationId,userId:user.id,role:'OWNER'}).onConflictDoNothing();
      memberRows=await tx.select({
        organizationId:memberships.organizationId,role:memberships.role
      }).from(memberships).where(eq(memberships.userId,user.id)).orderBy(memberships.createdAt);
    }

    const memberOrganizationIds=memberRows.map(m=>m.organizationId);
    const orgRows=memberOrganizationIds.length===0 ? [] : await tx.select({
      id:organizations.id,name:organizations.name
    }).from(organizations).where(and(
      eq(organizations.isDemo,false),
      inArray(organizations.id,memberOrganizationIds)
    ));
    const orgNames=new Map(orgRows.map(o=>[o.id,o.name]));
    const availableWorkspaces=Object.freeze(memberRows
      .filter(m=>orgNames.has(m.organizationId))
      .map(m=>Object.freeze({
        organizationId:m.organizationId,
        organizationName:orgNames.get(m.organizationId) ?? m.organizationId,
        role:m.role
      })));

    const cookieStore=await cookies();
    const requestedOrganizationId=cookieStore.get('evalomics_workspace')?.value;
    const primary=(requestedOrganizationId
      ? memberRows.find(m=>m.organizationId===requestedOrganizationId)
      : undefined) ?? memberRows[0];
    if(!primary) throw new Error('WORKSPACE_MEMBERSHIP_REQUIRED');

    const organization=(await tx.select().from(organizations).where(and(
      eq(organizations.id,primary.organizationId),eq(organizations.isDemo,false)
    )).limit(1)).at(0);
    if(!organization) throw new Error('PRODUCTION_ORGANIZATION_REQUIRED');

    const appSession:AuthenticatedSession=Object.freeze({
      userId:user.id,
      memberships:Object.freeze(memberRows.map(m=>Object.freeze({organizationId:m.organizationId,role:m.role})))
    });
    return Object.freeze({
      userId:user.id,email,name,organizationId:organization.id,
      organizationName:organization.name,role:primary.role,
      onboardingCompleted:organization.onboardingCompletedAt!==null,session:appSession,
      availableWorkspaces
    });
  });
}

export async function resolveRuntimeWorkspace():Promise<RuntimeWorkspace|null>{
  const database=createDatabase(databaseUrl());
  try{return await resolveRuntimeWorkspaceUsing(database);}
  finally{await database.close();}
}

export async function withRuntimeWorkspace<T>(
  fn:(input:{workspace:RuntimeWorkspace;database:ReturnType<typeof createDatabase>})=>Promise<T>
):Promise<T>{
  const database=createDatabase(databaseUrl());
  try{
    const workspace=await resolveRuntimeWorkspaceUsing(database);
    if(!workspace) throw new Error('AUTH_REQUIRED');
    return await fn({workspace,database});
  } finally {
    await database.close();
  }
}
