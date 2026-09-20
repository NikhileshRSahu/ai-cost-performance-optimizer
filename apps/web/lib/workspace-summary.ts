import { withRuntimeWorkspace } from './runtime-workspace';

export type WorkspaceSummary=Readonly<{
  organizationId:string;
  organizationName:string;
  role:string;
  onboardingCompleted:boolean;
  observedSpend:string|null;
  currency:string;
  requests:string;
  completeImports:number;
  dataRange:Readonly<{start:string|null;end:string|null}>;
  latestImport:Readonly<{
    id:string;status:string;accepted:number;rejected:number;skipped:number;warnings:number;
    totalRows:number;acceptanceRate:number;rangeStart:string|null;rangeEnd:string|null;receivedAt:string;
  }>|null;
  providers:readonly Readonly<{provider:string;status:string;lastSyncAt:string|null;safeError:string|null;evidenceRows:number;dataStatus:'SYNCED_WITH_DATA'|'CONNECTED_NO_DATA'|'SYNC_FAILED'|'SYNC_PENDING'}>[];
  topModels:readonly Readonly<{model:string;provider:string;spend:string;requests:string;share:number}>[];
  evidenceCounts:Readonly<{potential:number;tested:number;verified:number}>;
  verifiedSavings:string|null;
  members:readonly Readonly<{email:string;role:string}>[];
  recommendations:readonly Readonly<{
    id:string;state:string;decision:string;confidence:string|null;amount:string|null;currency:string|null;
    title:string;measuredFact:string|null;nextAction:string|null;limitation:string|null;kind:string|null;
    sourceImportId:string|null;currentConfigurationId:string|null;
  }>[];
}>;

function evidenceValue(evidence:unknown,key:string):string|null{
  if(evidence && typeof evidence==='object' && !Array.isArray(evidence)){
    const v=(evidence as Record<string,unknown>)[key];
    return typeof v==='string' && v.trim()?v:null;
  }
  return null;
}

export async function loadWorkspaceSummary():Promise<WorkspaceSummary>{
  return withRuntimeWorkspace(async({workspace,database})=>{
    const orgId=workspace.organizationId;
    const orgResult=await database.pool.query(
      'SELECT reporting_currency FROM public.organizations WHERE id=$1 AND is_demo=false LIMIT 1',[orgId]
    );
    const currency=String(orgResult.rows[0]?.reporting_currency ?? 'USD');

    const latestImportResult=await database.pool.query(
      "SELECT id,status::text,accepted_rows,rejected_rows,skipped_rows,warning_count,range_start::text,range_end::text,received_at::text FROM public.import_runs WHERE organization_id=$1 AND is_demo=false ORDER BY received_at DESC LIMIT 1",
      [orgId]
    );
    const li=latestImportResult.rows[0] as any;
    const activeImportId=li?.id?String(li.id):null;

    const totalsResult=activeImportId
      ? await database.pool.query(
          'SELECT COALESCE(SUM(CASE WHEN currency=$2 THEN total_cost::numeric ELSE 0 END),0)::text AS spend, COALESCE(SUM(requests::numeric),0)::text AS requests, MIN(interval_start)::text AS start, MAX(interval_end)::text AS "end" FROM public.usage_records WHERE organization_id=$1 AND import_run_id=$3 AND is_demo=false',
          [orgId,currency,activeImportId]
        )
      : await database.pool.query(
          'SELECT COALESCE(SUM(CASE WHEN currency=$2 THEN total_cost::numeric ELSE 0 END),0)::text AS spend, COALESCE(SUM(requests::numeric),0)::text AS requests, MIN(interval_start)::text AS start, MAX(interval_end)::text AS "end" FROM public.usage_records WHERE organization_id=$1 AND is_demo=false',
          [orgId,currency]
        );
    const totals=totalsResult.rows[0] ?? {spend:'0',requests:'0',start:null,end:null};

    const providerSpendResult=await database.pool.query(
      "SELECT COALESCE(SUM((item->>'amount')::numeric),0)::text AS spend FROM public.provider_evidence_snapshots p, LATERAL jsonb_array_elements(p.cost_evidence) item WHERE p.organization_id=$1 AND p.is_demo=false AND upper(COALESCE(item->>'currency',''))=$2",
      [orgId,currency]
    );
    const csvSpend=Number(totals.spend ?? 0);
    const providerSpend=Number(providerSpendResult.rows[0]?.spend ?? 0);
    // A CSV import is treated as a coherent active dataset. Older imports are
    // history and are never silently added to the current answer.
    const observed=activeImportId?csvSpend:(providerSpend>0?providerSpend:csvSpend);
    const totalRows=li?Number(li.accepted_rows)+Number(li.rejected_rows)+Number(li.skipped_rows):0;
    const latestImport=li?Object.freeze({
      id:String(li.id),status:String(li.status),accepted:Number(li.accepted_rows),rejected:Number(li.rejected_rows),
      skipped:Number(li.skipped_rows),warnings:Number(li.warning_count),totalRows,
      acceptanceRate:totalRows>0?Number(li.accepted_rows)/totalRows:0,
      rangeStart:li.range_start?String(li.range_start):null,rangeEnd:li.range_end?String(li.range_end):null,
      receivedAt:String(li.received_at)
    }):null;

    const providersResult=await database.pool.query(
      `SELECT pc.provider,pc.last_sync_status,pc.last_sync_at,pc.safe_error_category,
              COALESCE((
                SELECT SUM(jsonb_array_length(s.usage_evidence)+jsonb_array_length(s.cost_evidence))
                FROM public.provider_evidence_snapshots s
                WHERE s.organization_id=pc.organization_id
                  AND s.is_demo=false
                  AND s.source=CASE WHEN pc.provider='OPENAI' THEN 'OPENAI_ADMIN_API' ELSE 'ANTHROPIC_ADMIN_API' END
              ),0)::int AS evidence_rows
       FROM public.provider_connections pc
       WHERE pc.organization_id=$1 AND pc.revoked_at IS NULL
       ORDER BY pc.provider`,[orgId]
    );

    const topModelsResult=activeImportId
      ? await database.pool.query(
          "SELECT COALESCE(model,'Unknown') AS model, provider, COALESCE(SUM(CASE WHEN currency=$2 THEN total_cost::numeric ELSE 0 END),0)::text AS spend, COALESCE(SUM(requests::numeric),0)::text AS requests FROM public.usage_records WHERE organization_id=$1 AND import_run_id=$3 AND is_demo=false GROUP BY provider,model ORDER BY SUM(CASE WHEN currency=$2 THEN total_cost::numeric ELSE 0 END) DESC LIMIT 5",
          [orgId,currency,activeImportId]
        )
      : await database.pool.query(
          "SELECT COALESCE(model,'Unknown') AS model, provider, COALESCE(SUM(CASE WHEN currency=$2 THEN total_cost::numeric ELSE 0 END),0)::text AS spend, COALESCE(SUM(requests::numeric),0)::text AS requests FROM public.usage_records WHERE organization_id=$1 AND is_demo=false GROUP BY provider,model ORDER BY SUM(CASE WHEN currency=$2 THEN total_cost::numeric ELSE 0 END) DESC LIMIT 5",
          [orgId,currency]
        );
    const topModels=Object.freeze(topModelsResult.rows.map((r:any)=>Object.freeze({
      model:String(r.model),provider:String(r.provider),spend:String(r.spend),requests:String(r.requests),
      share:observed>0?Number(r.spend)/observed:0
    })));

    const recsResult=activeImportId
      ? await database.pool.query(
          "SELECT id,saving_state::text AS state,decision,confidence_band,net_saving_numerator,net_saving_denominator,currency,evidence FROM public.recommendations WHERE organization_id=$1 AND is_demo=false AND (saving_state::text <> 'OPPORTUNITY' OR evidence->>'sourceImportId'=$2) ORDER BY created_at DESC LIMIT 100",
          [orgId,activeImportId]
        )
      : await database.pool.query(
          'SELECT id,saving_state::text AS state,decision,confidence_band,net_saving_numerator,net_saving_denominator,currency,evidence FROM public.recommendations WHERE organization_id=$1 AND is_demo=false ORDER BY created_at DESC LIMIT 100',
          [orgId]
        );
    const counts={potential:0,tested:0,verified:0};
    for(const r of recsResult.rows){
      if(r.state==='OPPORTUNITY') counts.potential++;
      else if(r.state==='TESTED') counts.tested++;
      else if(r.state==='VERIFIED') counts.verified++;
    }

    const verifiedResult=await database.pool.query(
      "SELECT COALESCE(SUM(CASE WHEN net_impact_numerator ~ '^-?[0-9]+$' AND net_impact_denominator ~ '^[1-9][0-9]*$' THEN net_impact_numerator::numeric / net_impact_denominator::numeric ELSE 0 END),0)::text AS total FROM public.verification_windows WHERE organization_id=$1 AND status='VERIFIED'",
      [orgId]
    );
    const membersResult=await database.pool.query(
      'SELECT u.email,m.role::text AS role FROM public.memberships m JOIN public.users u ON u.id=m.user_id WHERE m.organization_id=$1 ORDER BY m.created_at',[orgId]
    );
    const importsResult=await database.pool.query(
      "SELECT count(*)::int AS count FROM public.import_runs WHERE organization_id=$1 AND is_demo=false AND status IN ('COMPLETED','PARTIAL')",[orgId]
    );

    return Object.freeze({
      organizationId:orgId,organizationName:workspace.organizationName,role:workspace.role,
      onboardingCompleted:workspace.onboardingCompleted,
      observedSpend:observed>0?observed.toFixed(2):null,currency,
      requests:String(totals.requests ?? '0'),completeImports:Number(importsResult.rows[0]?.count ?? 0),
      dataRange:Object.freeze({start:totals.start?String(totals.start):null,end:totals.end?String(totals.end):null}),
      latestImport,
      providers:Object.freeze(providersResult.rows.map((p:any)=>{
        const status=String(p.last_sync_status);
        const evidenceRows=Number(p.evidence_rows??0);
        const dataStatus=status==='FAILED'?'SYNC_FAILED':status==='READY'?(evidenceRows>0?'SYNCED_WITH_DATA':'CONNECTED_NO_DATA'):'SYNC_PENDING';
        return Object.freeze({
          provider:String(p.provider),status,lastSyncAt:p.last_sync_at?String(p.last_sync_at):null,
          safeError:p.safe_error_category?String(p.safe_error_category):null,evidenceRows,dataStatus
        });
      })),
      topModels,
      evidenceCounts:Object.freeze(counts),
      verifiedSavings:Number(verifiedResult.rows[0]?.total ?? 0)!==0?Number(verifiedResult.rows[0].total).toFixed(2):null,
      members:Object.freeze(membersResult.rows.map((m:any)=>Object.freeze({email:String(m.email),role:String(m.role)}))),
      recommendations:Object.freeze(recsResult.rows.map((r:any)=>Object.freeze({
        id:String(r.id),state:String(r.state),decision:String(r.decision),
        confidence:r.confidence_band?String(r.confidence_band):null,
        amount:r.net_saving_numerator&&r.net_saving_denominator?String(Number(r.net_saving_numerator)/Number(r.net_saving_denominator)):null,
        currency:r.currency?String(r.currency):null,
        title:evidenceValue(r.evidence,'title')??String(r.id),
        measuredFact:evidenceValue(r.evidence,'measuredFact'),
        nextAction:evidenceValue(r.evidence,'nextAction'),
        limitation:evidenceValue(r.evidence,'principalLimitation'),
        kind:evidenceValue(r.evidence,'opportunityKind'),
        sourceImportId:evidenceValue(r.evidence,'sourceImportId'),
        currentConfigurationId:evidenceValue(r.evidence,'currentConfigurationId')
      })))
    });
  });
}
