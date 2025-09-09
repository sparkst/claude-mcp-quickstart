# Multi-Agent Chat Interface Example

A complete implementation of a multi-agent chat system with streaming responses, agent selection, and conversation memory.

## Features
- Real-time streaming responses
- Multiple specialized agents
- Conversation history with Supabase
- Smart search routing (Tavily vs Context7)
- Token tracking and cost estimation
- Error handling and retry logic

## File Structure
```
chat-interface/
├── ChatInterface.tsx      # Main chat component
├── AgentSelector.tsx      # Agent selection UI
├── MessageList.tsx        # Message display
├── useChat.ts            # Chat logic hook
├── api/chat.ts           # API endpoints
└── agents/               # Agent definitions
    ├── researcher.ts
    ├── coder.ts
    └── writer.ts
```

## Implementation

### ChatInterface.tsx
```tsx
import { useState, useRef, useEffect } from 'react';
import { useChat } from './useChat';
import { AgentSelector } from './AgentSelector';
import { MessageList } from './MessageList';
import { Send, Loader2 } from 'lucide-react';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('general');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    error
  } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message, selectedAgent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">AI Chat</h1>
          <AgentSelector 
            value={selectedAgent}
            onChange={setSelectedAgent}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
}
```

### useChat.ts
```typescript
import { useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  timestamp: Date;
  tokens?: number;
  cost?: number;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, agent: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          agent,
          history: messages.slice(-10) // Last 10 messages for context
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        agent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                assistantMessage.content += data.content;
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { ...m, content: assistantMessage.content }
                      : m
                  )
                );
              }

              if (data.tokens) {
                assistantMessage.tokens = data.tokens;
              }

              if (data.cost) {
                assistantMessage.cost = data.cost;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // Save to Supabase
      await saveConversation(userMessage, assistantMessage);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  const saveConversation = async (userMsg: Message, assistantMsg: Message) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .insert([
          {
            user_message: userMsg.content,
            assistant_message: assistantMsg.content,
            agent: assistantMsg.agent,
            tokens_used: assistantMsg.tokens,
            cost_usd: assistantMsg.cost,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Failed to save conversation:', error);
      }
    } catch (err) {
      console.error('Supabase error:', err);
    }
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    cancelRequest
  };
}
```

### api/chat.ts
```typescript
import { OpenAI } from 'openai';
import { searchWithRouter } from '@/services/search-router';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export async function POST(req: Request) {
  const { message, agent, history } = await req.json();

  // Get agent configuration
  const agentConfig = getAgentConfig(agent);

  // Add search context if needed
  let context = '';
  if (agentConfig.needsSearch) {
    const searchResults = await searchWithRouter(message);
    context = formatSearchResults(searchResults);
  }

  // Prepare messages
  const messages = [
    { role: 'system', content: agentConfig.systemPrompt },
    ...history.map((m: any) => ({
      role: m.role,
      content: m.content
    })),
    { 
      role: 'user', 
      content: context ? `${message}\n\nContext:\n${context}` : message 
    }
  ];

  // Create streaming response
  const stream = await openai.chat.completions.create({
    model: agentConfig.model,
    messages,
    temperature: agentConfig.temperature,
    stream: true,
    max_tokens: agentConfig.maxTokens
  });

  // Return SSE stream
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let totalTokens = 0;
      let content = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          content += delta.content;
          totalTokens += estimateTokens(delta.content);

          const data = {
            content: delta.content,
            tokens: totalTokens,
            cost: calculateCost(totalTokens, agentConfig.model)
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        }
      }

      controller.close();
    }
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

function getAgentConfig(agent: string) {
  const configs: Record<string, any> = {
    general: {
      systemPrompt: 'You are a helpful AI assistant.',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
      needsSearch: false
    },
    researcher: {
      systemPrompt: 'You are an expert research analyst...',
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 3000,
      needsSearch: true
    },
    coder: {
      systemPrompt: 'You are a senior software engineer...',
      model: 'gpt-4o',
      temperature: 0.2,
      maxTokens: 4000,
      needsSearch: true // For documentation
    },
    writer: {
      systemPrompt: 'You are a professional content writer...',
      model: 'gpt-4o-mini',
      temperature: 0.8,
      maxTokens: 2500,
      needsSearch: false
    }
  };

  return configs[agent] || configs.general;
}

function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

function calculateCost(tokens: number, model: string): number {
  const rates: Record<string, number> = {
    'gpt-4o': 0.01 / 1000,      // $0.01 per 1K tokens
    'gpt-4o-mini': 0.0015 / 1000, // $0.0015 per 1K tokens
  };

  return tokens * (rates[model] || 0);
}

function formatSearchResults(results: any): string {
  if (!results || results.length === 0) return '';

  return results
    .slice(0, 3)
    .map((r: any) => `${r.title}\n${r.snippet}`)
    .join('\n\n');
}
```

## Usage

1. Import the ChatInterface component
2. Set up environment variables
3. Create Supabase tables
4. Deploy n8n workflows
5. Start chatting!

## Supabase Schema

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  agent TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
```

## n8n Workflow

See `chat-workflow.json` for the complete n8n workflow configuration.

---

*This example demonstrates a production-ready multi-agent chat interface with all the bells and whistles.*
