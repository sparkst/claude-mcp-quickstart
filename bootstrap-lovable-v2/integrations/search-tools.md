# Smart Search Tool Routing

## Decision Matrix for Search Tools

### Tavily Search
**Best for:**
- Current events and news
- General web information
- Product reviews and comparisons
- Local business information
- Social media trends
- Non-technical topics

**Characteristics:**
- Fast response times
- Good for broad queries
- Returns recent results
- Includes snippets and summaries

**Example queries:**
```javascript
// Good Tavily queries
"latest news about AI regulations"
"best coffee shops in Seattle"
"iPhone 15 vs Samsung Galaxy reviews"
"climate change effects 2024"
"Taylor Swift tour dates"
```

### Context7
**Best for:**
- Technical documentation
- API references
- Framework/library guides
- Programming tutorials
- Software architecture patterns
- DevOps and cloud services

**Characteristics:**
- Deep technical knowledge
- Structured documentation
- Code examples included
- Version-specific information

**Example queries:**
```javascript
// Good Context7 queries
"React hooks useEffect cleanup"
"AWS Lambda cold start optimization"
"PostgreSQL indexing strategies"
"Next.js 14 app router migration"
"Docker multi-stage build patterns"
```

### Perplexity
**Best for:**
- Academic research
- Complex multi-step reasoning
- Comparative analysis
- Statistical data
- Scientific explanations
- Historical research

**Characteristics:**
- Citation-heavy responses
- Deep reasoning capabilities
- Handles complex queries well
- Good source attribution

**Example queries:**
```javascript
// Good Perplexity queries
"compare quantum computing approaches IBM vs Google"
"statistical analysis of remote work productivity studies"
"historical precedents for antitrust cases in tech"
"peer-reviewed research on mRNA vaccines"
"economic impact of automation on employment"
```

## Smart Router Implementation

### Automatic Tool Selection
```javascript
class SearchRouter {
  constructor() {
    this.patterns = {
      tavily: [
        /\b(news|latest|current|today|yesterday)\b/i,
        /\b(review|compare|versus|vs)\b/i,
        /\b(near me|local|nearby)\b/i,
        /\b(trend|viral|popular)\b/i,
        /\b(weather|sports|entertainment)\b/i
      ],
      context7: [
        /\b(api|sdk|library|framework)\b/i,
        /\b(react|vue|angular|nextjs|nodejs)\b/i,
        /\b(aws|azure|gcp|docker|kubernetes)\b/i,
        /\b(python|javascript|typescript|rust|go)\b/i,
        /\b(function|method|class|interface)\b/i,
        /\b(error|bug|debug|stack trace)\b/i
      ],
      perplexity: [
        /\b(research|study|analysis|paper)\b/i,
        /\b(scientific|academic|scholarly)\b/i,
        /\b(statistics|data|correlation)\b/i,
        /\b(compare.*and.*and)\b/i,  // Multi-comparison
        /\b(historical|precedent|timeline)\b/i,
        /\b(explain|how does|why does)\b/i
      ]
    };
  }

  selectTool(query) {
    const scores = {
      tavily: 0,
      context7: 0,
      perplexity: 0
    };

    // Pattern matching
    for (const [tool, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          scores[tool] += 10;
        }
      }
    }

    // Query complexity analysis
    const wordCount = query.split(' ').length;
    if (wordCount > 15) scores.perplexity += 5;
    if (wordCount < 5) scores.tavily += 5;

    // Technical indicator boost
    if (this.containsCode(query)) scores.context7 += 15;
    
    // Academic indicator boost
    if (this.containsCitation(query)) scores.perplexity += 10;

    // Select highest scoring tool
    const selected = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      tool: selected,
      confidence: scores[selected] / Math.max(...Object.values(scores)),
      scores
    };
  }

  containsCode(query) {
    return /[{}\[\]();]|function|const|let|var|import|export/.test(query);
  }

  containsCitation(query) {
    return /\b(cite|source|reference|study|journal|paper)\b/i.test(query);
  }
}
```

### Hybrid Search Strategy
```javascript
class HybridSearcher {
  constructor() {
    this.router = new SearchRouter();
    this.cache = new Map();
  }

  async search(query, options = {}) {
    // Check cache first
    const cacheKey = this.getCacheKey(query, options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Route to appropriate tool
    const { tool, confidence } = this.router.selectTool(query);
    
    // If low confidence, use multiple tools
    if (confidence < 0.6 && !options.singleTool) {
      return this.multiSearch(query, options);
    }

    // Execute search
    let results;
    switch(tool) {
      case 'tavily':
        results = await this.searchTavily(query, options);
        break;
      case 'context7':
        results = await this.searchContext7(query, options);
        break;
      case 'perplexity':
        results = await this.searchPerplexity(query, options);
        break;
    }

    // Cache results
    this.cache.set(cacheKey, results);
    setTimeout(() => this.cache.delete(cacheKey), 3600000); // 1 hour TTL

    return results;
  }

  async multiSearch(query, options) {
    const searches = [
      this.searchTavily(query, options),
      this.searchContext7(query, options)
    ];

    const results = await Promise.allSettled(searches);
    
    return {
      type: 'hybrid',
      sources: results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .flat()
    };
  }

  async searchTavily(query, options) {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TAVILY_API_KEY
      },
      body: JSON.stringify({
        query,
        search_depth: options.depth || 'basic',
        include_answer: true,
        include_raw_content: options.includeRaw || false,
        max_results: options.limit || 5
      })
    });

    const data = await response.json();
    
    return {
      tool: 'tavily',
      query,
      answer: data.answer,
      results: data.results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        score: r.score
      }))
    };
  }

  async searchContext7(query, options) {
    // First resolve library ID if needed
    const libraryId = await this.resolveContext7Library(query);
    
    const response = await fetch('https://api.context7.com/docs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CONTEXT7_API_KEY}`
      },
      body: JSON.stringify({
        libraryId,
        query,
        maxTokens: options.maxTokens || 5000
      })
    });

    const data = await response.json();
    
    return {
      tool: 'context7',
      query,
      library: libraryId,
      content: data.content,
      examples: data.examples
    };
  }

  async searchPerplexity(query, options) {
    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'perplexity-pro',
        messages: [{
          role: 'user',
          content: query
        }],
        citations: true,
        temperature: 0.2
      })
    });

    const data = await response.json();
    
    return {
      tool: 'perplexity',
      query,
      answer: data.choices[0].message.content,
      citations: data.citations
    };
  }

  getCacheKey(query, options) {
    return `${query}:${JSON.stringify(options)}`;
  }

  async resolveContext7Library(query) {
    // Extract potential library names
    const libraries = {
      'react': '/facebook/react',
      'nextjs': '/vercel/next.js',
      'vue': '/vuejs/core',
      'aws': '/aws/documentation',
      'docker': '/docker/docs'
    };

    for (const [keyword, id] of Object.entries(libraries)) {
      if (query.toLowerCase().includes(keyword)) {
        return id;
      }
    }

    // Default to general docs
    return '/general/web-development';
  }
}
```

## Usage Examples

### Basic Search
```javascript
const searcher = new HybridSearcher();

// Automatically routes to Tavily
const news = await searcher.search("latest AI startup funding rounds");

// Automatically routes to Context7
const docs = await searcher.search("React Server Components implementation");

// Automatically routes to Perplexity
const research = await searcher.search("comparative analysis of transformer architectures");
```

### Forced Tool Selection
```javascript
// Force specific tool
const results = await searcher.search(
  "JavaScript frameworks",
  { tool: 'context7' }
);

// Multi-tool search
const hybrid = await searcher.search(
  "machine learning in production",
  { multiTool: true }
);
```

### Advanced Configuration
```javascript
// With options
const detailed = await searcher.search("quantum computing", {
  depth: 'advanced',
  limit: 10,
  includeRaw: true,
  maxTokens: 10000
});

// With caching disabled
const fresh = await searcher.search("stock prices", {
  noCache: true
});
```

## n8n Workflow Integration

### Search Router Node
```json
{
  "nodes": [
    {
      "name": "Search Router",
      "type": "function",
      "position": [250, 300],
      "parameters": {
        "functionCode": "const query = $input.item.json.query;\n\n// Routing logic\nconst patterns = {\n  tavily: /news|latest|review/i,\n  context7: /api|react|function/i,\n  perplexity: /research|study|analysis/i\n};\n\nlet selectedTool = 'tavily';\nfor (const [tool, pattern] of Object.entries(patterns)) {\n  if (pattern.test(query)) {\n    selectedTool = tool;\n    break;\n  }\n}\n\nreturn {\n  tool: selectedTool,\n  query: query\n};"
      }
    },
    {
      "name": "Switch",
      "type": "switch",
      "position": [450, 300],
      "parameters": {
        "dataType": "string",
        "value1": "={{$json.tool}}",
        "rules": [
          {
            "value2": "tavily",
            "output": 0
          },
          {
            "value2": "context7",
            "output": 1
          },
          {
            "value2": "perplexity",
            "output": 2
          }
        ]
      }
    }
  ]
}
```

## Cost Optimization

### Tool Cost Comparison
```javascript
const SEARCH_COSTS = {
  tavily: {
    basic: 0.001,    // $0.001 per search
    advanced: 0.005  // $0.005 per deep search
  },
  context7: {
    standard: 0.002  // $0.002 per 1000 tokens
  },
  perplexity: {
    api: 0.01       // $0.01 per request
  }
};

function estimateCost(tool, options) {
  switch(tool) {
    case 'tavily':
      return SEARCH_COSTS.tavily[options.depth || 'basic'];
    case 'context7':
      const tokens = options.maxTokens || 5000;
      return (tokens / 1000) * SEARCH_COSTS.context7.standard;
    case 'perplexity':
      return SEARCH_COSTS.perplexity.api;
  }
}
```

### Intelligent Caching
```javascript
class SearchCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      savings: 0
    };
  }

  async get(key, generator, cost) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      this.stats.savings += cost;
      return this.cache.get(key);
    }

    this.stats.misses++;
    const result = await generator();
    
    // Cache based on cost and frequency
    if (cost > 0.005 || this.isFrequent(key)) {
      this.cache.set(key, result);
    }

    return result;
  }

  isFrequent(key) {
    // Track query frequency
    // Return true if queried multiple times
    return false; // Simplified
  }
}
```

## Error Handling

### Fallback Strategy
```javascript
async function searchWithFallback(query, primaryTool) {
  const fallbackOrder = {
    'tavily': ['perplexity', 'context7'],
    'context7': ['tavily', 'perplexity'],
    'perplexity': ['tavily', 'context7']
  };

  try {
    return await search(query, primaryTool);
  } catch (error) {
    console.error(`${primaryTool} failed:`, error);
    
    for (const fallback of fallbackOrder[primaryTool]) {
      try {
        console.log(`Trying fallback: ${fallback}`);
        return await search(query, fallback);
      } catch (fallbackError) {
        console.error(`${fallback} also failed:`, fallbackError);
      }
    }
    
    // All tools failed
    throw new Error('All search tools unavailable');
  }
}
```

---

*Remember: The best search tool is the one that returns the most relevant results for your specific query. Use the router as a starting point, but always be ready to override based on actual results.*
