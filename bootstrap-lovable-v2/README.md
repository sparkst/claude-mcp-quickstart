# Bootstrap Lovable v2.0 Framework
*The AI Product Architect's Complete Toolkit*

## 🚀 Quick Start

This framework provides a complete system for building prompt-driven, multi-agent AI products with Lovable.dev as your frontend and n8n as your AI/ops backbone.

### Core Philosophy
- **Speed over perfection** - Ship fast, iterate based on real usage
- **Schema-first design** - Every interaction has a defined structure
- **Observability built-in** - Instrument everything from day one
- **Cost-aware by default** - Smart model routing and caching strategies
- **User-first UX** - Stream responses, fail gracefully, delight users

## 📁 Directory Structure

```
bootstrap-lovable-v2/
├── README.md                    # You are here
├── ACTIVATION.md               # Dev Mode triggers & shortcuts
├── core/
│   ├── skippy-persona.md      # Skippy the Magnificent persona
│   ├── prompt-rules.md        # Core prompt engineering rules
│   ├── architecture.md        # System architecture patterns
│   └── safety-standards.md    # Output & safety standards
├── patterns/
│   ├── index.md               # Pattern library index
│   ├── ai-systems.md          # Multi-agent patterns
│   ├── ai-ux.md              # UX patterns for AI
│   ├── data-rag.md           # RAG & knowledge patterns
│   └── ops-safety.md         # Observability & safety
├── integrations/
│   ├── n8n-workflows.md      # n8n best practices
│   ├── data-stores.md        # Postgres, Supabase, Qdrant, Redis
│   ├── ai-models.md          # OpenAI, Claude, Perplexity routing
│   ├── search-tools.md       # Smart Tavily & Context7 routing
│   └── external-apis.md      # Google, Telegram, email configs
├── templates/
│   ├── prd-template.md        # Product requirements doc
│   ├── agent-prompt.md        # Agent prompt template
│   ├── n8n-workflow.json      # Base n8n workflow
│   └── error-handling.md      # Error & incident templates
├── examples/
│   ├── chat-interface/        # Multi-agent chat example
│   ├── content-pipeline/      # Content generation pipeline
│   ├── rag-system/           # Document RAG implementation
│   └── monitoring-dash/       # Telemetry dashboard
└── scripts/
    ├── setup.sh              # Initial setup script
    ├── deploy.sh             # Deployment helper
    └── backup.sh             # Backup automation
```

## 🎯 When to Use What

### Mode Selection
- **IDEATION Mode**: Starting fresh, exploring patterns, architecting systems
- **IMPLEMENTATION Mode**: Building specific features, writing prompts, configuring workflows

### Search Tool Routing (Enhanced v2.0)
- **Tavily**: General web search, news, current events, broad research
- **Context7**: Technical documentation, API references, framework guides
- **Perplexity**: Academic research, complex reasoning, multi-step queries

## 🔧 Core Components

### 1. Lovable Frontend
- React + Tailwind for rapid UI
- Streaming response handlers
- Error boundaries with graceful fallbacks
- Mobile-responsive by default

### 2. n8n Backend
- Webhook endpoints for all interactions
- Retry logic with exponential backoff
- Rate limiting and backpressure handling
- Comprehensive error telemetry

### 3. Data Layer
- **Supabase**: User data, auth, realtime sync
- **Qdrant**: Vector search for RAG
- **Redis**: Response caching, rate limiting
- **Postgres**: Analytics, audit logs

### 4. AI Models (Cost-Optimized Routing)
- **GPT-4o-mini**: Default for most tasks
- **GPT-4o**: Complex reasoning, code generation
- **Claude 3.5 Sonnet**: Long context, nuanced writing
- **Ollama/Local**: Privacy-sensitive, high-volume

## 📊 Telemetry & Monitoring

Every request tracked with:
- `run_id`: Unique identifier for request chain
- `tokens_used`: Input/output token counts
- `model_costs`: Calculated costs per model
- `latency_ms`: End-to-end and per-step timing
- `error_rates`: Failure tracking by type

## 🚨 Safety & Compliance

- PII detection and masking
- Content moderation filters
- Rate limiting per user/endpoint
- Audit logging for compliance
- Canary deployments for changes

## 💰 Cost Management

Built-in strategies:
1. **Smart Caching**: Redis for repeated queries
2. **Model Routing**: Cheapest model that works
3. **Prompt Optimization**: Minimal tokens, maximum clarity
4. **Batch Processing**: Group similar requests
5. **Usage Limits**: Per-user quotas and alerts

## 🎮 Quick Commands

```bash
# Setup new project
./scripts/setup.sh PROJECT_NAME

# Deploy to production
./scripts/deploy.sh --env production

# Run local development
npm run dev

# Generate telemetry report
npm run report:weekly
```

## 📚 Learning Path

1. Start with `ACTIVATION.md` for Dev Mode triggers
2. Review `core/prompt-rules.md` for prompt engineering
3. Browse `patterns/index.md` for common solutions
4. Check `examples/` for working implementations
5. Use `templates/` for new components

## 🤝 Contributing

This framework evolves with usage. Document your patterns, share your workflows, improve the templates. The best abstractions emerge from real implementations.

---

*Built with Bootstrap Lovable v2.0 - Ship Fast, Learn Faster*
