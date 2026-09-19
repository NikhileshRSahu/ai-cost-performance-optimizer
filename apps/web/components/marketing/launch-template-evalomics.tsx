import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CloudUpload,
  Database,
  FileSpreadsheet,
  FlaskConical,
  Gauge,
  Layers3,
  Network,
  Orbit,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { EvalomicsMark } from '../evalomics-mark';
import { HeroIntelligence } from './hero-intelligence';
import { Section2DashboardScroll } from './section2-dashboard-scroll';
import { ProofMotion } from './proof-motion';

const capabilities = [
  [
    'Multi-provider ingestion',
    'OpenAI, Anthropic, and CSV usage in one evidence model.',
    CloudUpload,
  ],
  [
    'Evidence-first savings',
    'Potential, tested, and verified claims never collapse into one number.',
    BarChart3,
  ],
  [
    'Work MRI',
    'See model, prompt, context, workflow, and spend patterns together.',
    BrainCircuit,
  ],
  [
    'Benchmarking & testing',
    'Compare alternatives against your required quality floor.',
    FlaskConical,
  ],
  [
    'Model & workflow optimization',
    'Find safer routing, caching, context, and workflow changes.',
    Workflow,
  ],
  [
    'Verified savings',
    'Reconcile tested changes against production evidence.',
    ShieldCheck,
  ],
  [
    'Prompt & workflow insights',
    'Surface repeated input, oversized context, and tool-cost patterns when the source evidence supports them.',
    ScanSearch,
  ],
  [
    'Direct next actions',
    'Rank the strongest supported move instead of showing endless charts.',
    Zap,
  ],
] as const;

const driverBars = [
  ['gpt-4o', '42%', 82],
  ['gpt-4-turbo', '24%', 58],
  ['gpt-3.5-turbo', '18%', 44],
  ['embeddings', '7%', 24],
  ['other', '9%', 31],
] as const;

function MiniDashboard() {
  return (
    <div className="eval-template-dashboard">
      <div className="eval-template-dashboard__rail">
        <div className="eval-template-dashboard__brand">
          <EvalomicsMark size={22} />
          <span>Evalomics</span>
        </div>
        {['Overview', 'AI usage', 'Opportunities', 'Testing', 'Verified'].map(
          (label, index) => (
            <div
              key={label}
              className={
                index === 0
                  ? 'eval-template-dashboard__nav is-active'
                  : 'eval-template-dashboard__nav'
              }
            >
              <span className="eval-template-dashboard__nav-dot" />
              {label}
            </div>
          ),
        )}
      </div>

      <div className="eval-template-dashboard__main">
        <div className="eval-template-dashboard__topline">
          <div>
            <span className="eval-template-kicker">
              Illustrative usage · analyzed
            </span>
            <h3>Cost intelligence</h3>
          </div>
          <span className="eval-template-sync">
            <span /> Last 30 days
          </span>
        </div>

        <div className="eval-template-metrics">
          {[
            ['Observed spend', '$1,774.78', 'Measured'],
            ['Modeled upside', '$286–$421', 'Potential'],
            ['Verified savings', '$0.00', 'Not yet verified'],
          ].map(([label, value, meta], index) => (
            <div key={label} className="eval-template-metric">
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{meta}</small>
              <div className={'eval-template-sparkline spark-' + String(index)} />
            </div>
          ))}
        </div>

        <div className="eval-template-next-action">
          <div>
            <span>Recommended next action</span>
            <strong>
              Benchmark repeated input against your quality floor.
            </strong>
          </div>
          <Link href="/demo#recommendation" className="eval-template-link">
            See details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function CostDrivers() {
  return (
    <div className="eval-template-mini-panel eval-template-cost-drivers">
      <div className="eval-template-mini-title">Top cost drivers</div>
      <div className="eval-template-driver-list">
        {driverBars.map(([name, value, width]) => (
          <div className="eval-template-driver" key={name}>
            <span>{name}</span>
            <div>
              <i style={{ width: String(width) + '%' }} />
            </div>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequestFlow() {
  return (
    <div className="eval-template-mini-panel eval-template-flow-panel">
      <div className="eval-template-mini-title">Request flow</div>
      <div className="eval-template-flow">
        <div className="eval-template-flow-labels">
          {[
            'User requests',
            'System prompts',
            'RAG / context',
            'Tool calls',
            'Fine-tuned models',
          ].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="eval-template-flow-lines" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, index) => (
            <i key={index} style={{ ['--i' as string]: index }} />
          ))}
        </div>
        <div className="eval-template-flow-output">
          <span>Repeated input</span>
          <span>Long context</span>
          <span>Model mismatch</span>
        </div>
      </div>
    </div>
  );
}

function EvidenceSteps() {
  return (
    <div className="eval-template-proof-stack">
      {[
        ['Potential · sample', '$286–$421', 'is-potential'],
        ['Tested · sample', '$142.17', 'is-tested'],
        ['Verified · sample', '$109.32', 'is-verified'],
      ].map(([label, value, className], index) => (
        <div className={'eval-template-proof ' + className} key={label}>
          <span>
            {index === 0 ? (
              <Gauge size={16} />
            ) : index === 1 ? (
              <FlaskConical size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
          </span>
          <strong>{label}</strong>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}

export function LaunchTemplateEvalomics() {
  return (
    <div className="eval-template-page">
      <div className="eval-template-announcement">
        Evidence-first AI cost optimization <span>·</span> Potential ≠ Tested ≠
        Verified
      </div>

      <header className="eval-template-nav">
        <Link href="/" className="eval-template-brand">
          <EvalomicsMark size={25} />
          <span>Evalomics</span>
          <small>Public beta</small>
        </Link>
        <nav>
          <Link href="#product-story">Product</Link>
          <Link href="#capabilities">Capabilities</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <div className="eval-template-nav-actions">
          <Link href="/login">Sign in</Link>
          <Link
            href="/start?intent=start"
            className="eval-template-button eval-template-button--light"
          >
            Start free
          </Link>
        </div>
      </header>

      <main>
        <section className="eval-template-hero" id="product">
          <div className="eval-template-hero-copy">
            <div className="eval-template-pill">
              <Sparkles size={13} /> Evidence-first AI economics
              <Link href="/methodology">
                Read methodology <ArrowRight size={12} />
              </Link>
            </div>
            <h1>Make the invisible economics of AI visible.</h1>
            <p>
              Ingest OpenAI, Anthropic, or CSV usage. Reconstruct where
              requests, tokens, models, and spend go. Detect inefficient
              patterns, test safer alternatives against a required quality
              floor, and verify what actually improved.
            </p>
            <div className="eval-template-hero-actions">
              <Link
                href="/start?intent=analyze"
                className="eval-template-button eval-template-button--light"
              >
                Analyze my AI usage <ArrowRight size={16} />
              </Link>
              <Link
                href="/demo"
                className="eval-template-button eval-template-button--glass"
              >
                Explore live demo
              </Link>
            </div>
            <div className="eval-template-provider-row">
              <span>
                <Database size={14} /> OpenAI
              </span>
              <span>
                <Network size={14} /> Anthropic
              </span>
              <span>
                <FileSpreadsheet size={14} /> CSV
              </span>
              <span>·</span>
              <span>No credit card</span>
            </div>
          </div>

          <div
            className="eval-template-hero-world"
            aria-label="Animated Evalomics product overview"
          >
            <div className="eval-template-hero-glow eval-motion-decorative" />
            <div className="eval-template-orbit eval-template-orbit--one eval-motion-decorative" />
            <div className="eval-template-orbit eval-template-orbit--two eval-motion-decorative" />
            <div className="eval-template-layer eval-template-layer--back eval-motion-decorative">
              <HeroIntelligence />
            </div>
            <div className="eval-template-layer eval-template-layer--main eval-motion-decorative">
              <MiniDashboard />
            </div>
            <div className="eval-template-layer eval-template-layer--drivers eval-motion-decorative">
              <CostDrivers />
            </div>
            <div className="eval-template-layer eval-template-layer--flow eval-motion-decorative">
              <RequestFlow />
            </div>
            <div className="eval-template-hero-note">
              From AI usage
              <br />
              to verified outcomes <ArrowRight size={15} />
            </div>
          </div>
        </section>

        <Section2DashboardScroll />

        <section className="eval-template-intro">
          <span>How Evalomics works</span>
          <h2>From AI usage to evidence-backed savings.</h2>
          <p>
            One evidence chain: observe what happened, detect supported
            opportunities, benchmark alternatives, implement carefully, then
            verify the production outcome.
          </p>
        </section>

        <section className="eval-template-bento">
          <article className="eval-template-feature-card eval-template-feature-card--large">
            <div className="eval-template-feature-copy">
              <span>01 · Detect waste patterns</span>
              <h3>Find what is costing you.</h3>
              <p>
                Repeated input, oversized context, model mismatch, and low-value
                tool calls become visible.
              </p>
            </div>
            <div className="eval-template-cluster-visual eval-motion-decorative">
              <div className="eval-template-cluster-tooltip">
                <strong>Example: repeated input</strong>
                <span>1,248 similar requests</span>
                <b>$87.42 modeled</b>
              </div>
              {Array.from({ length: 18 }).map((_, index) => (
                <i key={index} style={{ ['--n' as string]: index }} />
              ))}
            </div>
          </article>

          <article className="eval-template-feature-card eval-template-feature-card--large">
            <div className="eval-template-feature-copy">
              <span>02 · Test safely</span>
              <h3>Quality is a gate, not an afterthought.</h3>
              <p>
                Optimizations must meet the required quality floor before
                savings can move forward.
              </p>
            </div>
            <div className="eval-template-quality-visual">
              <div className="eval-template-quality-side">
                <span>Current · sample</span>
                <b>$1.00 / request</b>
              </div>
              <div className="eval-template-quality-lines left eval-motion-decorative" />
              <div className="eval-template-quality-gate eval-motion-decorative">
                <ShieldCheck size={25} />
              </div>
              <div className="eval-template-quality-lines right eval-motion-decorative" />
              <div className="eval-template-quality-side right">
                <span>Candidate · sample</span>
                <b>$0.28 / request</b>
              </div>
            </div>
          </article>

          <article className="eval-template-feature-card">
            <div className="eval-template-feature-copy">
              <span>03 · Verify in production</span>
              <h3>Move from potential to proven savings.</h3>
              <p>
                Tested changes only become verified after production evidence is
                reconciled.
              </p>
            </div>
            <EvidenceSteps />
          </article>

          <article className="eval-template-feature-card">
            <div className="eval-template-feature-copy">
              <span>04 · Work MRI</span>
              <h3>See the operating system behind your AI spend.</h3>
              <p>
                Map products, prompts, context, tools, and model choices into
                one operational picture.
              </p>
            </div>
            <div className="eval-template-radar eval-motion-decorative">
              <span>
                <Layers3 size={16} />
              </span>
              <span>
                <Database size={16} />
              </span>
              <span>
                <Workflow size={16} />
              </span>
              <span>
                <Orbit size={16} />
              </span>
              <b>
                <EvalomicsMark size={24} />
              </b>
            </div>
          </article>
        </section>

        <ProofMotion />

        <section className="eval-template-capabilities" id="capabilities">
          <span>Everything you need</span>
          <h2>Built for real-world AI usage.</h2>
          <div className="eval-template-capability-grid">
            {capabilities.map(([title, description, Icon]) => (
              <article key={title}>
                <Icon size={19} />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="eval-template-horizon">
          <div className="eval-template-horizon-copy">
            <span>A clearer way forward</span>
            <h2>
              See what your AI usage costs.
              <br />
              And what is safe to change.
            </h2>
            <p>
              Turn AI spend into a measurable operating advantage with
              Evalomics.
            </p>
            <div>
              <Link
                href="/start?intent=analyze"
                className="eval-template-button eval-template-button--light"
              >
                Analyze my AI usage <ArrowRight size={16} />
              </Link>
              <Link
                href="/demo"
                className="eval-template-button eval-template-button--glass"
              >
                Explore live demo
              </Link>
            </div>
          </div>
          <div className="eval-template-planet eval-motion-decorative">
            <div className="eval-template-planet-ring one" />
            <div className="eval-template-planet-ring two" />
            <div className="eval-template-planet-ring three" />
          </div>
          <div className="eval-template-horizon-benefits">
            <span>
              <i /> Lower cost
            </span>
            <span>
              <i /> Protected quality
            </span>
            <span>
              <i /> Verified outcomes
            </span>
          </div>
        </section>
      </main>

      <footer className="eval-template-footer">
        <div>
          <Link href="/" className="eval-template-brand">
            <EvalomicsMark size={23} />
            <span>Evalomics</span>
          </Link>
          <p>AI Efficiency Intelligence for evidence-backed optimization.</p>
        </div>
        <nav>
          <Link href="/methodology">Methodology</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/security">Security</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </div>
  );
}
