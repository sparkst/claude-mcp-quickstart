#!/bin/bash

# Bootstrap Lovable v2.0 - Project Setup Script
# Usage: ./setup.sh PROJECT_NAME

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if project name provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Project name required${NC}"
    echo "Usage: ./setup.sh PROJECT_NAME"
    exit 1
fi

PROJECT_NAME=$1
PROJECT_DIR="./$PROJECT_NAME"

echo -e "${BLUE}🚀 Bootstrap Lovable v2.0 - Setting up $PROJECT_NAME${NC}"

# Create project structure
echo -e "${YELLOW}Creating project structure...${NC}"
mkdir -p "$PROJECT_DIR"/{src,public,api,config,data,tests,docs}
mkdir -p "$PROJECT_DIR"/src/{components,hooks,utils,styles,services}
mkdir -p "$PROJECT_DIR"/api/{agents,workflows,webhooks}
mkdir -p "$PROJECT_DIR"/config/{n8n,env}
mkdir -p "$PROJECT_DIR"/data/{cache,uploads,exports}

# Create .gitignore
echo -e "${YELLOW}Creating .gitignore...${NC}"
cat > "$PROJECT_DIR/.gitignore" << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.test.js.snap

# Production
build/
dist/
.next/
out/

# Misc
.DS_Store
*.pem
.vscode/
.idea/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Data
data/cache/*
data/uploads/*
!data/cache/.gitkeep
!data/uploads/.gitkeep

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
EOF

# Create .env.example
echo -e "${YELLOW}Creating environment template...${NC}"
cat > "$PROJECT_DIR/.env.example" << 'EOF'
# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
CONTEXT7_API_KEY=c7-...
PERPLEXITY_API_KEY=pplx-...

# Database
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_KEY=

# Monitoring
BETTER_STACK_API_KEY=
SENTRY_DSN=

# App Config
NODE_ENV=development
PORT=3000
API_PORT=3001
PUBLIC_URL=http://localhost:3000
EOF

# Create package.json
echo -e "${YELLOW}Initializing package.json...${NC}"
cat > "$PROJECT_DIR/package.json" << 'EOF'
{
  "name": "PROJECT_NAME",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "n8n": "n8n start",
    "setup": "node scripts/setup.js",
    "deploy": "node scripts/deploy.js"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.9.0",
    "ioredis": "^5.3.2",
    "zod": "^3.22.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.290.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "prettier": "^3.0.0"
  }
}
EOF

# Update project name in package.json
sed -i.bak "s/PROJECT_NAME/$PROJECT_NAME/g" "$PROJECT_DIR/package.json" && rm "$PROJECT_DIR/package.json.bak"

# Create README
echo -e "${YELLOW}Creating README...${NC}"
cat > "$PROJECT_DIR/README.md" << EOF
# $PROJECT_NAME

Built with Bootstrap Lovable v2.0

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev

# In another terminal, start n8n
npm run n8n
\`\`\`

## Project Structure

\`\`\`
$PROJECT_NAME/
├── src/                 # Frontend source
│   ├── components/     # React components
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utilities
│   └── services/      # API services
├── api/                # Backend logic
│   ├── agents/        # AI agent definitions
│   ├── workflows/     # n8n workflows
│   └── webhooks/      # Webhook handlers
├── config/            # Configuration
├── data/             # Data storage
└── tests/            # Test files
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests
- \`npm run n8n\` - Start n8n workflow engine
- \`npm run deploy\` - Deploy to production

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: n8n, Node.js
- **AI**: OpenAI, Claude, Tavily, Context7
- **Database**: Supabase, Redis, Qdrant
- **Monitoring**: BetterStack, Sentry

## Documentation

See \`/docs\` for detailed documentation.

---

*Powered by Bootstrap Lovable v2.0*
EOF

# Create basic Next.js app structure
echo -e "${YELLOW}Creating Next.js structure...${NC}"

# Create next.config.js
cat > "$PROJECT_DIR/next.config.js" << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.PUBLIC_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
EOF

# Create tailwind.config.js
cat > "$PROJECT_DIR/tailwind.config.js" << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
EOF

# Create main app file
echo -e "${YELLOW}Creating main app file...${NC}"
mkdir -p "$PROJECT_DIR/app"
cat > "$PROJECT_DIR/app/page.tsx" << 'EOF'
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Bootstrap Lovable v2.0
        </h1>
        <p className="text-gray-600 mb-8">
          Your AI-powered application is ready to build
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Get Started
          </button>
          <button className="px-6 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition">
            Documentation
          </button>
        </div>
      </div>
    </main>
  )
}
EOF

# Create layout file
cat > "$PROJECT_DIR/app/layout.tsx" << 'EOF'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bootstrap Lovable App',
  description: 'AI-powered application built with Bootstrap Lovable v2.0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
EOF

# Create global CSS
cat > "$PROJECT_DIR/app/globals.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
EOF

# Create example AI service
echo -e "${YELLOW}Creating AI service example...${NC}"
cat > "$PROJECT_DIR/src/services/ai.ts" << 'EOF'
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResponse(prompt: string, options = {}) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant built with Bootstrap Lovable v2.0'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      stream: true,
      ...options
    });

    return completion;
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate response');
  }
}

export async function searchWithTavily(query: string) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.TAVILY_API_KEY!
    },
    body: JSON.stringify({
      query,
      search_depth: 'basic',
      max_results: 5
    })
  });

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}

export async function searchWithContext7(query: string, library: string) {
  // Context7 implementation
  const response = await fetch('/api/context7/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, library })
  });

  return response.json();
}
EOF

# Create n8n workflow template
echo -e "${YELLOW}Creating n8n workflow template...${NC}"
cat > "$PROJECT_DIR/api/workflows/main-workflow.json" << 'EOF'
{
  "name": "Main AI Workflow",
  "nodes": [
    {
      "parameters": {
        "path": "/webhook/process",
        "responseMode": "responseNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "model": "gpt-4o-mini",
        "messages": {
          "values": [
            {
              "role": "user",
              "content": "={{$json.query}}"
            }
          ]
        }
      },
      "name": "OpenAI",
      "type": "@n8n/n8n-nodes-openai.openAi",
      "position": [450, 300]
    },
    {
      "parameters": {
        "options": {}
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [650, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "OpenAI",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
EOF

# Create .gitkeep files
touch "$PROJECT_DIR"/data/cache/.gitkeep
touch "$PROJECT_DIR"/data/uploads/.gitkeep

# Create TypeScript config
echo -e "${YELLOW}Creating TypeScript config...${NC}"
cat > "$PROJECT_DIR/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

echo -e "${GREEN}✅ Project setup complete!${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo "1. cd $PROJECT_NAME"
echo "2. npm install"
echo "3. cp .env.example .env"
echo "4. Edit .env with your API keys"
echo "5. npm run dev"
echo
echo -e "${YELLOW}Happy building with Bootstrap Lovable v2.0! 🚀${NC}"
