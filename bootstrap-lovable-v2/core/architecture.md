# System Architecture Patterns

## Core Architecture Principles

### 1. Separation of Concerns
- **Frontend (Lovable)**: UI/UX, user interactions, display logic
- **Orchestration (n8n)**: Workflow management, API routing, error handling
- **AI Layer**: Model selection, prompt execution, response processing
- **Data Layer**: Storage, caching, vector search
- **Observability**: Logging, metrics, alerting

### 2. Stream-First Design
```
User → Lovable → n8n Webhook → AI Model → Stream → User
         ↓          ↓              ↓
      [Cache]   [Telemetry]   [Fallback]
```

### 3. Fail Gracefully
Every component should degrade gracefully:
- Primary model → Fallback model → Cached response → Error message
- Real-time → Async queue → Batch processing
- Full features → Essential features → Maintenance mode

## Multi-Agent Architectures

### Pattern 1: Pipeline (Sequential)
```
User Input → Agent A → Agent B → Agent C → Output
              ↓          ↓          ↓
           [Extract]  [Process]  [Format]
```

**Use when**: Tasks have clear sequential dependencies
**Example**: Research → Write → Edit → Publish

### Pattern 2: Parallel Processing
```
              → Agent A →
User Input →  → Agent B →  → Aggregator → Output
              → Agent C →
```

**Use when**: Multiple independent analyses needed
**Example**: Sentiment + Keywords + Entities extraction

### Pattern 3: Hierarchical (Manager-Worker)
```
User → Manager Agent → Task Assignment
           ↓
      [Workers Pool]
      /    |    \
  Worker1 Worker2 Worker3
      \    |    /
        Results
```

**Use when**: Dynamic task allocation needed
**Example**: Customer service routing

### Pattern 4: Consensus
```
User Input → [Agent A, Agent B, Agent C] → Voting → Output
                                              ↓
                                         [Arbiter]
```

**Use when**: High confidence needed
**Example**: Content moderation, medical diagnosis

### Pattern 5: Self-Improving Loop
```
Input → Agent → Output
  ↑               ↓
  ← Evaluator ←
```

**Use when**: Quality improvement over time
**Example**: Writing improvement, code optimization

## n8n Workflow Patterns

### Basic Request Handler
```javascript
// Webhook Node
{
  "path": "/api/process",
  "method": "POST",
  "responseMode": "responseNode"
}

// Validation Node
if (!body.message) {
  throw new Error("Message required");
}

// AI Processing Node
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant"
    },
    {
      "role": "user", 
      "content": "{{$json.body.message}}"
    }
  ]
}

// Response Node
{
  "status": 200,
  "body": {
    "response": "{{$json.choices[0].message.content}}",
    "tokens": "{{$json.usage.total_tokens}}",
    "run_id": "{{$executionId}}"
  }
}
```

### Retry Pattern with Backoff
```javascript
// Error Trigger
on_error: true

// Retry Logic
const retryCount = $items[0].json.retryCount || 0;
const maxRetries = 3;
const backoffMs = Math.pow(2, retryCount) * 1000;

if (retryCount < maxRetries) {
  await new Promise(r => setTimeout(r, backoffMs));
  return {
    ...originalRequest,
    retryCount: retryCount + 1
  };
} else {
  // Send to dead letter queue
  await notifyError(originalRequest);
}
```

### Rate Limiting Pattern
```javascript
// Redis Check
const key = `rate:${userId}:${endpoint}`;
const current = await redis.incr(key);

if (current === 1) {
  await redis.expire(key, 60); // 1 minute window
}

if (current > RATE_LIMIT) {
  return {
    status: 429,
    error: "Rate limit exceeded"
  };
}
```

## Data Store Architecture

### Primary Storage (Supabase/Postgres)
```sql
-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations and messages
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telemetry and analytics
CREATE TABLE api_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status INTEGER,
  latency_ms INTEGER,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Vector Store (Qdrant)
```javascript
// Collection schema
{
  "name": "documents",
  "vectors": {
    "size": 1536,  // OpenAI embedding size
    "distance": "Cosine"
  },
  "payload_schema": {
    "source": "keyword",
    "content": "text",
    "metadata": "json",
    "created_at": "datetime"
  }
}
```

### Cache Layer (Redis)
```javascript
// Cache key patterns
"cache:chat:{user_id}:{hash}"     // Response cache
"rate:{user_id}:{endpoint}"       // Rate limiting
"session:{session_id}"            // Session data
"queue:{priority}:{timestamp}"    // Job queue
"lock:{resource_id}"              // Distributed locks
```

## Service Communication

### REST API Design
```yaml
/api/v1/
  /chat:
    POST: Start new conversation
    GET /{id}: Get conversation history
  /agents:
    GET: List available agents
    POST /{agent}/invoke: Execute agent
  /documents:
    POST: Upload document
    GET /{id}: Retrieve document
    DELETE /{id}: Remove document
  /search:
    POST: Vector similarity search
```

### WebSocket Events
```javascript
// Real-time streaming
ws.on('message', async (data) => {
  const { type, payload } = JSON.parse(data);
  
  switch(type) {
    case 'stream_start':
      // Initialize streaming
      break;
    case 'stream_chunk':
      // Send partial response
      ws.send(JSON.stringify({
        type: 'chunk',
        content: chunk
      }));
      break;
    case 'stream_end':
      // Finalize and clean up
      break;
  }
});
```

### Event-Driven Architecture
```javascript
// Event emitter pattern
events.on('document.uploaded', async (doc) => {
  await processDocument(doc);
  await indexDocument(doc);
  events.emit('document.ready', doc);
});

events.on('error.critical', async (error) => {
  await logError(error);
  await notifyOncall(error);
  await createIncident(error);
});
```

## Security Patterns

### API Key Management
```javascript
// Hierarchical key structure
const keys = {
  master: process.env.MASTER_KEY,        // Admin operations
  service: process.env.SERVICE_KEY,      // Inter-service
  user: generateUserKey(),               // Per-user limits
  webhook: process.env.WEBHOOK_SECRET    // Webhook validation
};
```

### Input Validation
```javascript
const schema = {
  type: 'object',
  properties: {
    message: { 
      type: 'string', 
      minLength: 1, 
      maxLength: 10000 
    },
    model: { 
      enum: ['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet'] 
    }
  },
  required: ['message']
};

if (!validate(input, schema)) {
  throw new ValidationError(validate.errors);
}
```

### Output Sanitization
```javascript
// Remove PII and sensitive data
function sanitizeOutput(text) {
  // Email addresses
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  
  // Phone numbers
  text = text.replace(/\+?[1-9]\d{1,14}/g, '[PHONE]');
  
  // Credit cards
  text = text.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
  
  return text;
}
```

## Deployment Architecture

### Environment Structure
```
Development → Staging → Production
     ↓           ↓           ↓
  [Local]    [Preview]   [Global CDN]
```

### Service Distribution
```yaml
Frontend:
  - Vercel/Netlify (Global CDN)
  - Environment variables for API endpoints

Backend (n8n):
  - Docker containers
  - Kubernetes for scaling
  - Health checks and auto-restart

Databases:
  - Supabase (Managed Postgres)
  - Redis Cloud (Managed Redis)
  - Qdrant Cloud (Managed Vector DB)

Monitoring:
  - BetterStack (Uptime & Logs)
  - Grafana (Metrics)
  - Sentry (Error tracking)
```

## Cost Optimization Architecture

### Model Router
```javascript
function selectModel(task) {
  // Route to cheapest capable model
  if (task.complexity === 'simple') {
    return 'gpt-4o-mini';  // $0.15/1M tokens
  } else if (task.requiresLongContext) {
    return 'claude-3.5-sonnet';  // Better context window
  } else if (task.privacy) {
    return 'llama-3-local';  // No external API
  } else {
    return 'gpt-4o';  // Complex reasoning
  }
}
```

### Caching Strategy
```javascript
// Multi-tier cache
async function getCachedOrGenerate(key, generator) {
  // L1: Memory cache (instant)
  if (memCache.has(key)) return memCache.get(key);
  
  // L2: Redis cache (fast)
  const cached = await redis.get(key);
  if (cached) {
    memCache.set(key, cached);
    return cached;
  }
  
  // L3: Generate and cache
  const result = await generator();
  await redis.setex(key, 3600, result);  // 1 hour TTL
  memCache.set(key, result);
  
  return result;
}
```

---

*Remember: Architecture is about making the right trade-offs. Optimize for your specific constraints - whether that's cost, latency, reliability, or developer velocity.*
