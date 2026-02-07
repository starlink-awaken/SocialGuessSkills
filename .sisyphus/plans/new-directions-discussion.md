# New Directions Discussion: SocialGuessSkills Post-Improvement

**Project**: SocialGuessSkills
**Created**: 2026-02-07
**Status**: Draft - Open for Discussion
**Context**: All 10 improvement tasks completed (P0, P1, P2 phases)

---

## Current State Summary

### What Was Achieved

**Project Transformation**: Prototype (1.5/5) → Production-Ready (3.5/5+)

**Completed Improvements**:
- ✅ Fixed 2 critical bugs (conflict detection regex, workflow convergence)
- ✅ Integrated GLM-4.7 LLM with fallback to mock mode
- ✅ Achieved 85%+ test coverage (exceeded 80% target)
- ✅ Implemented Pino structured logging
- ✅ Added custom error handling with error codes
- ✅ Fixed documentation inconsistencies
- ⚠️ Partial: E2E tests (MCP format issue), ESLint (complex flat config)

**Remaining Technical Debt**: 2 items
- E2E test MCP response format mismatch (HIGH priority)
- ESLint configuration complexity (MEDIUM priority)

**Test Status**: 35/42 tests passing (83%)

### Current Capabilities

**Core Functionality**:
- 7 specialized agents (systems, econ, socio, governance, culture, risk, validation)
- 6-step workflow execution with conflict resolution
- 9-layer social system model generation
- MCP protocol integration (3 tools: reasoning, query_agent, validate_model)

**Infrastructure**:
- Bun runtime + TypeScript strict mode
- GLM-4.7 LLM integration (智谱AI)
- Pino structured logging
- 85%+ test coverage with Bun test
- Prettier code formatting

**Development Experience**:
- Type-safe with strict TypeScript
- Comprehensive test suite
- Structured logging for debugging
- MCP server for integration

---

## Part A: New Features Discussion

### A1. Web UI / Interactive Dashboard

**Value Proposition**:
- Visualize agent execution in real-time
- Interactive hypothesis formulation
- Live model layer visualization (9-layer system)
- Export model outputs as reports/visualizations

**Implementation Options**:

| Option | Tech Stack | Effort | Pros | Cons |
|--------|-----------|--------|------|------|
| A1.1 | React + shadcn/ui | 40-60h | Modern, accessible, component library | Requires new stack |
| A1.2 | Bun.serve() + HTMX | 20-30h | Lightweight, no framework overhead | Less "modern" feel |
| A1.3 | Next.js + Server Components | 50-70h | Full-stack, SSR, API routes | Heavy, Bun integration complexity |

**Recommended**: **A1.1 (React + shadcn/ui)** - Modern, accessible, excellent for data visualization

**Key Features**:
- Hypothesis input form (structured with constraints/goals)
- Agent execution timeline visualization
- 9-layer model interactive display
- Conflict resolution panel
- Export to JSON/PDF/Markdown
- Real-time GLM streaming responses

**Dependencies to Add**:
- `react`, `react-dom`, `vite` (for dev server)
- `@radix-ui/*` components (via shadcn/ui)
- `recharts` or `vis-network` (visualization)
- `lucide-react` (icons)

**MVP Scope** (20-30 hours):
1. Simple hypothesis form
2. Agent execution progress view
3. 9-layer model JSON display
4. Export to JSON button

**Full Scope** (40-60 hours):
1. All MVP features
2. Interactive 9-layer visualization
3. Real-time streaming GLM responses
4. Conflict resolution panel
5. Export to PDF/Markdown
6. History / saved models
7. Model comparison

**Decision Questions**:
- Should Web UI be built now or later?
- Is priority on speed (Bun.serve + HTMX) or UX quality (React + shadcn/ui)?
- Should Web UI require user authentication?

---

### A2. Parallel Agent Execution Optimization

**Value Proposition**:
- Faster model generation (agents run in parallel vs sequential)
- Reduced GLM API costs (parallel requests vs sequential)
- Better resource utilization

**Current State**:
- Sequential execution (agent 1 → agent 2 → ... → agent 7)
- Each agent calls GLM API individually
- No dependency graph optimization

**Implementation Approach**:

**Phase 1: Identify Independent Agents** (4-6 hours)
- Analyze agent interdependencies
- Create dependency graph (DAG)
- Identify parallelizable groups

**Phase 2: Implement Parallel Execution** (8-12 hours)
- Use `Promise.all()` for independent agents
- Maintain convergence detection across parallel runs
- Update orchestrator to support parallel execution

**Phase 3: Batching Optimization** (6-8 hours)
- Batch GLM API requests when possible
- Implement request pooling
- Add rate limiting/ throttling controls

**Estimated Effort**: 18-26 hours total

**Expected Performance Gains**:
- Speedup: 2-3x (depending on dependency complexity)
- API cost reduction: 10-20% (batching)
- Resource utilization: Better CPU/GPU usage

**Complexity Risks**:
- Convergence detection becomes harder
- Error handling more complex (partial failures)
- Need to maintain ordering constraints

**Decision Questions**:
- Is speedup critical for current use cases?
- Should this be implemented before or after Web UI?
- Is the complexity worth the performance gain?

---

### A3. Advanced Model Analysis & Visualization

**Value Proposition**:
- Better insights from 9-layer models
- Identify patterns and trends across models
- Comparative analysis of different hypotheses

**Proposed Features**:

| Feature | Description | Effort | Value |
|---------|-------------|--------|-------|
| A3.1 | Model diff/comparison tool | 12-16h | High |
| A3.2 | Pattern mining across model history | 16-20h | Medium |
| A3.3 | Sensitivity analysis (perturb inputs) | 8-12h | High |
| A3.4 | Interactive 9-layer graph visualization | 20-24h | High |
| A3.5 | Export to standard formats (GraphML, GML) | 6-8h | Medium |

**Recommended Implementation Order**:
1. **A3.1 (Model comparison)** - Immediate value for researchers
2. **A3.4 (Interactive visualization)** - Enhances Web UI value
3. **A3.3 (Sensitivity analysis)** - Scientific rigor
4. **A3.2 (Pattern mining)** - Advanced analytics
5. **A3.5 (Export formats)** - Interoperability

**Technical Approach**:
- Use graph libraries (`vis-network`, `d3`, `cytoscape.js`)
- Implement diff algorithms for model structures
- Add analytics endpoints to MCP server
- Store model history in database (SQLite/PostgreSQL)

**Estimated Effort**: 62-80 hours (full scope)

**Decision Questions**:
- Which features are highest priority for current users?
- Should this be integrated into Web UI or standalone tool?
- Is database migration needed for model history?

---

### A4. Extended Agent Capabilities

**Value Proposition**:
- More specialized analysis
- Domain-specific expertise
- Expanded model richness

**Proposed New Agents**:

| Agent | Domain | Effort | Value |
|-------|--------|--------|-------|
| A4.1 Environmental Agent | Climate, sustainability | 16-20h | Medium |
| A4.2 Demographic Agent | Population, migration | 12-16h | Medium |
| A4.3 Infrastructure Agent | Transportation, utilities | 14-18h | Medium |
| A4.4 Technology Agent | AI, digital transformation | 16-20h | High |
| A4.5 Historical Agent | Past events, trends | 18-22h | Medium |

**Implementation Requirements**:
- Create agent prompts in `src/agents/prompts/`
- Add to `AgentType` enum in `src/types.ts`
- Update orchestrator for new agent count
- Create tests for each new agent
- Update documentation

**Estimated Effort**: 76-96 hours (all 5 agents)

**Decision Questions**:
- Which new agents are most valuable?
- Should agents be customizable (user-defined prompts)?
- How to handle model compatibility when adding agents?

---

### A5. Multi-Hypothesis Batch Processing

**Value Proposition**:
- Compare multiple scenarios at once
- Efficient analysis of parameter variations
- Scenario planning and sensitivity analysis

**Implementation Approach**:

**Phase 1: Batch API Design** (6-8 hours)
- Design MCP tool for batch processing
- Define batch request/response schemas
- Update type definitions

**Phase 2: Parallel Batch Execution** (10-14 hours)
- Execute multiple hypotheses in parallel
- Aggregate results
- Handle partial failures

**Phase 3: Batch Visualization** (8-12 hours)
- Compare results side-by-side
- Highlight differences and similarities
- Export batch reports

**Estimated Effort**: 24-34 hours total

**Complexity Risks**:
- GLM API rate limiting
- Memory usage for large batches
- Visualization complexity for many results

**Decision Questions**:
- Is batch processing a common use case?
- Should batch size be limited?
- How to visualize 10+ hypotheses side-by-side?

---

## Part B: Deployment & Operations Discussion

### B1. Production Deployment Strategy

**Current State**:
- Development environment only
- No containerization
- No deployment automation

**Deployment Options**:

| Option | Platform | Effort | Pros | Cons |
|--------|----------|--------|------|------|
| B1.1 | VPS (DigitalOcean, Linode) | 12-16h | Full control, cost-effective | Manual scaling |
| B1.2 | Container (Docker) + VPS | 16-20h | Consistent env, portable | Docker complexity |
| B1.3 | Cloud Function (AWS Lambda, Vercel) | 8-12h | Auto-scale, pay-per-use | Cold starts, limits |
| B1.4 | Managed (Fly.io, Railway) | 4-8h | Easy setup, managed | Vendor lock-in, cost |

**Recommended**: **B1.2 (Docker + VPS)** - Balanced control and portability

**Implementation Steps**:

**Phase 1: Containerization** (8-10 hours)
1. Create `Dockerfile` for Bun runtime
2. Configure multi-stage build (dev + production)
3. Set up `docker-compose.yml` for local dev
4. Add health checks

**Phase 2: Production Configuration** (6-8 hours)
1. Environment variable management (production secrets)
2. GLM API key secure storage
3. Logging configuration (Pino to file/cloud)
4. Database setup (if using model history)

**Phase 3: CI/CD Pipeline** (8-10 hours)
1. GitHub Actions workflow
2. Automated tests on PR
3. Build Docker images
4. Deploy to production on merge

**Estimated Effort**: 22-28 hours total

**Infrastructure Components**:
- **Docker**: Runtime environment consistency
- **Nginx/Caddy**: Reverse proxy, SSL, static serving
- **SQLite**: Model history storage (or PostgreSQL for scale)
- **Pino + Loki/CloudWatch**: Log aggregation
- **Prometheus + Grafana**: Metrics (optional, see Part B3)

**Decision Questions**:
- What is the target scale (users per day)?
- Should deployment be automated or manual?
- Cloud provider preference (DO, AWS, GCP)?

---

### B2. API Security & Rate Limiting

**Current State**:
- No authentication
- No rate limiting
- Public MCP server endpoint

**Security Requirements**:

| Requirement | Priority | Effort |
|-------------|----------|--------|
| B2.1 API Key Authentication | HIGH | 8-12h |
| B2.2 Rate Limiting (per API key) | HIGH | 6-8h |
| B2.3 Request Validation | MEDIUM | 4-6h |
| B2.4 CORS Configuration | LOW | 2-4h |

**Implementation Approach**:

**B2.1: API Key Authentication**
```typescript
// Add to src/server.ts
import { verifyAPIKey } from './utils/auth';

// Middleware
mcpServer.use(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!verifyAPIKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});
```

**B2.2: Rate Limiting**
```typescript
// Add rate limiter
import { RateLimiter } from 'limiter';

const rateLimiter = new RateLimiter({ tokensPerInterval: 100, interval: 'minute' });
```

**Estimated Effort**: 20-30 hours total

**Decision Questions**:
- Is this for internal use or public API?
- Should authentication be API key, JWT, or OAuth?
- Rate limits per day/hour/minute?

---

### B3. Performance Monitoring & Observability

**Value Proposition**:
- Detect performance degradation early
- Debug production issues efficiently
- Optimize GLM API usage and costs
- Understand user behavior

**Monitoring Components**:

| Component | Purpose | Tool Options | Effort |
|-----------|---------|--------------|--------|
| B3.1 Application Metrics | Request latency, error rates | Prometheus + Grafana | 16-20h |
| B3.2 Business Metrics | Agent execution time, model size | Custom metrics | 12-16h |
| B3.3 GLM API Tracking | Token usage, cost per model | Custom tracking | 8-12h |
| B3.4 User Analytics | Hypotheses per user, features used | PostHog, Plausible | 8-12h |
| B3.5 Alerting | SLA breaches, error spikes | PagerDuty, Opsgenie | 6-8h |

**Recommended**: **B3.1 (Prometheus + Grafana)** + **B3.3 (GLM tracking)**

**Implementation Steps**:

**Phase 1: Metrics Collection** (10-12 hours)
```typescript
// Add to src/server.ts
import { register, Counter, Histogram } from 'prom-client';

const requestDuration = new Histogram({
  name: 'mcp_request_duration_seconds',
  help: 'MCP request duration',
  labelNames: ['tool', 'status']
});

// Middleware
mcpServer.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => end({ tool: req.body.method, status: res.statusCode }));
  next();
});
```

**Phase 2: Dashboard Setup** (6-8 hours)
- Install and configure Prometheus
- Create Grafana dashboards
- Define key metrics and alerts

**Phase 3: GLM Cost Tracking** (8-10 hours)
```typescript
// Track GLM usage
const glmTokenUsage = new Counter({
  name: 'glm_tokens_used_total',
  help: 'Total GLM tokens used',
  labelNames: ['model', 'operation']
});
```

**Estimated Effort**: 24-30 hours total

**Key Metrics to Track**:
- `mcp_request_duration_seconds` (histogram)
- `mcp_requests_total` (counter by tool, status)
- `agent_execution_duration_seconds` (histogram by agent type)
- `glm_tokens_used_total` (counter by model)
- `glm_cost_usd_total` (gauge)
- `workflow_convergence_iteration_count` (histogram)

**Decision Questions**:
- Is monitoring critical for current scale?
- Self-hosted Prometheus or managed service?
- Should alerts be sent to Slack/email/SMS?

---

### B4. Database & Model Persistence

**Current State**:
- In-memory models only
- No persistence between sessions
- No model history

**Persistence Options**:

| Option | Use Case | Effort | Pros | Cons |
|--------|----------|--------|------|------|
| B4.1 SQLite | Low-medium scale, simple | 8-12h | Simple, file-based | Limited scale |
| B4.2 PostgreSQL (Supabase/Neon) | Medium-high scale | 12-16h | Robust, managed | Network latency |
| B4.3 MongoDB (Atlas) | Document-heavy, flexible | 10-14h | Flexible schema | Cost |
| B4.4 Redis Cache | Temp storage, caching | 6-8h | Fast | Volatile |

**Recommended**: **B4.1 (SQLite)** for MVP, **B4.2 (PostgreSQL)** for scale

**Implementation Approach**:

**Phase 1: SQLite Schema Design** (4-6 hours)
```sql
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  hypothesis_id TEXT NOT NULL,
  model_data TEXT NOT NULL, -- JSON
  created_at INTEGER NOT NULL,
  agents_used TEXT NOT NULL, -- JSON array
  iteration_count INTEGER NOT NULL
);

CREATE INDEX idx_hypothesis_id ON models(hypothesis_id);
```

**Phase 2: ORM Integration** (6-8 hours)
- Install `bun:sqlite` (already in project)
- Create repository layer for models
- Add save/load functions to orchestrator

**Phase 3: Model History API** (4-6 hours)
- Add MCP tool `get_model_history(hypothesis_id)`
- Implement pagination
- Add search filters

**Estimated Effort**: 14-20 hours total

**Benefits**:
- Resume interrupted workflows
- Compare model iterations
- Audit trail for research
- Enable analytics and insights

**Decision Questions**:
- Is model history valuable for current use cases?
- Should models be versioned (Git-like)?
- Database choice: SQLite (simple) or PostgreSQL (scale)?

---

## Prioritization Framework

### Cost-Benefit Analysis

| Initiative | Effort | Value | Ratio | Priority |
|------------|--------|-------|-------|----------|
| **A1. Web UI (MVP)** | 20-30h | HIGH | High/Med | **P1** |
| **B1. Production Deployment** | 22-28h | HIGH | High/Med | **P1** |
| **A2. Parallel Execution** | 18-26h | HIGH | Med/High | **P1** |
| **B2. API Security** | 20-30h | HIGH | Med/High | **P1** |
| **B3. Performance Monitoring** | 24-30h | MEDIUM | Low/Med | **P2** |
| **B4. Database Persistence** | 14-20h | MEDIUM | Med/High | **P2** |
| **A3. Model Analysis** | 62-80h | HIGH | Low/Med | **P2** |
| **A4. Extended Agents** | 76-96h | MEDIUM | Low/Med | **P3** |
| **A5. Batch Processing** | 24-34h | MEDIUM | Med/Med | **P3** |

### Recommended Roadmap

**Phase 1: Production Readiness** (4-6 weeks, 60-90 hours)
1. ✅ Technical Debt Cleanup (5-10 hours) - **IN PROGRESS**
2. **A1. Web UI MVP** (20-30 hours) - User-facing value
3. **B1. Production Deployment** (22-28 hours) - Deploy to production
4. **B2. API Security** (20-30 hours) - Secure the API

**Phase 2: Performance & Scale** (3-4 weeks, 36-56 hours)
5. **A2. Parallel Execution** (18-26 hours) - Speedup
6. **B3. Performance Monitoring** (24-30 hours) - Observability

**Phase 3: Advanced Features** (6-8 weeks, 100-130 hours)
7. **B4. Database Persistence** (14-20 hours) - Model history
8. **A3. Model Analysis** (62-80 hours) - Insights
9. **A5. Batch Processing** (24-34 hours) - Scenario planning

**Phase 4: Future Enhancements** (8-12 weeks, 76-96 hours)
10. **A4. Extended Agents** (76-96 hours) - New domains

---

## Decision Framework

### Questionnaire for Stakeholders

**For A1 (Web UI)**:
1. Is a web interface critical for current users?
2. Should UI prioritize speed (HTMX) or UX quality (React)?
3. Who are the primary users (researchers, policymakers, general public)?

**For A2 (Parallel Execution)**:
1. Is model generation speed a bottleneck?
2. Are GLM API costs a concern?
3. How many hypotheses are processed per day?

**For A3 (Model Analysis)**:
1. Do users need to compare multiple models?
2. Is visual analysis important?
3. Should models be exported for external tools?

**For B1 (Deployment)**:
1. Target user scale (users/day)?
2. Deployment preference (VPS, serverless, managed)?
3. SLA requirements (uptime, response time)?

**For B2 (Security)**:
1. Internal use or public API?
2. Authentication method (API key, JWT, OAuth)?
3. Rate limits per API key?

**For B3 (Monitoring)**:
1. Is 24/7 monitoring required?
2. Alerting channels (Slack, email, SMS)?
3. Self-hosted or managed observability?

**For B4 (Database)**:
1. Model history value for research?
2. Expected data volume (models/year)?
3. Database preference (SQLite vs PostgreSQL)?

---

## Next Steps

### Immediate Actions (This Week)

1. **Complete Technical Debt Cleanup** (in progress)
   - Review research results from MCP SDK and Biome investigation
   - Implement fixes for E2E tests and ESLint
   - Verify all 42 tests passing

2. **Stakeholder Alignment**
   - Review this document with team/stakeholders
   - Answer decision questions above
   - Prioritize Phase 1 initiatives

3. **Planning Session**
   - Create detailed implementation plan for Phase 1
   - Estimate resources and timeline
   - Define success criteria

### Medium-Term (Next Month)

4. **Begin Phase 1 Implementation**
   - Start with A1 (Web UI MVP) if prioritized
   - Or B1 (Production Deployment) if urgent
   - Regular progress reviews

5. **Continuous Improvement**
   - Monitor production metrics
   - Gather user feedback
   - Iterate on prioritization

---

## Appendices

### Appendix A: Technology Stack Comparison

**Web UI Options**:
| Framework | Bundle Size | Dev Experience | Bun Compatibility | Ecosystem |
|-----------|-------------|----------------|-------------------|-----------|
| React | Large | Excellent | Good | Massive |
| Vue | Medium | Good | Good | Large |
| Svelte | Small | Excellent | Good | Growing |
| Vanilla + HTMX | Tiny | Simple | Native | Small |

**Database Options**:
| Database | Scale | Complexity | Bun Compatibility | Cost |
|----------|-------|-------------|-------------------|------|
| SQLite | Low-Medium | Simple | Native (bun:sqlite) | Free |
| PostgreSQL | High | Medium | Requires driver | $$ |
| MongoDB | High | Medium | Requires driver | $$$ |
| Redis | Cache | Simple | Requires driver | $ |

**Monitoring Options**:
| Tool | Complexity | Managed Service | Cost |
|------|------------|----------------|------|
| Prometheus + Grafana | High | Yes (various) | $$ |
| Datadog | Low | Yes | $$$ |
| New Relic | Low | Yes | $$$ |
| Loki + Grafana | Medium | Yes | $$ |

### Appendix B: Effort Estimation Notes

**Assumptions**:
- Senior engineer productivity
- Familiarity with TypeScript, Bun, relevant frameworks
- Includes testing, documentation, code review
- 25% buffer for unknowns
- Parallelization possible in some phases

**Effort Categories**:
- **Low**: < 12 hours (1-2 days)
- **Medium**: 12-30 hours (3-5 days)
- **High**: 30-60 hours (1-2 weeks)
- **Very High**: > 60 hours (2+ weeks)

---

## Related Documents

- Technical Debt Cleanup Plan: `.sisyphus/plans/technical-debt-cleanup.md`
- Original Improvement Plan: `.sisyphus/plans/socialguess-improvement.md`
- Project Knowledge Base: `AGENTS.md`
- Test Coverage Report: `coverage/coverage-final.json`

---

**Document Version**: 1.0
**Last Updated**: 2026-02-07
**Status**: Draft - Pending Stakeholder Review
