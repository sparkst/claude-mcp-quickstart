# Advanced Lovable Development Guide

## 🚀 Getting Started

### 1. First-Time Setup

After installing this MCP quickstart, you have access to:
- **Supabase Integration**: Direct access to your database, auth, and storage
- **GitHub Integration**: Repository analysis, commit reviews, and code insights  
- **AI Assistant**: Your development co-pilot with personality
- **Context7 + Tavily**: Smart documentation and web search routing

### Getting Your Supabase Access Token

To enable full Supabase integration, you'll need an access token:

1. **Visit**: [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. **Create New Token**: Click "Generate new token"
3. **Name**: Give it a name like "Claude MCP Access"
4. **Permissions**: Select the projects you want Claude to access
5. **Copy Token**: Save it securely - you'll need it during setup

**Note**: This is different from your project API keys. Access tokens let Claude see all your projects and their schemas.

**Quick Test Commands:**
```
Show me what you can do
Analyze my current project
What MCP servers are active?
```

### 2. Understanding Your Supabase Setup

Start by exploring your database:
```
Help me understand my Supabase setup
Show me my database schema
Check my RLS policies
```

Your AI assistant will:
- Map your entire database structure
- Identify potential security issues
- Suggest optimizations and best practices
- Explain relationships between tables

### 3. Analyzing Your Project

Get a comprehensive project overview:
```
Review my recent commits
Analyze my project structure
Suggest architectural improvements
```

## 🛠️ Building Your First Feature

### Step 1: Planning
Ask your AI assistant: *"I want to add [feature description]"*

Your assistant will:
1. **Analyze Requirements**: Understand the feature scope and complexity
2. **Suggest Architecture**: Recommend optimal patterns  
3. **Plan Implementation**: Break down into steps
4. **Consider Edge Cases**: Identify potential issues

### Step 2: Implementation
```
Dev Mode: create [feature] with Lovable patterns
```

Example features:
- `Dev Mode: create streaming chat interface`
- `Dev Mode: add user authentication with RLS`
- `Dev Mode: create real-time notifications`
- `Dev Mode: build admin dashboard`

### Step 3: Testing & Optimization
```
Review this implementation
Optimize my database queries
Add error handling
```

## 🎯 Common Lovable Development Patterns

*Pro tip: Start with "Which pattern should I use for [feature]?" to get personalized recommendations based on your specific use case.*

## 🧠 Working with Your AI Assistant

### Assistant Modes

**🔍 Research Mode**
```
Research the best approach for [problem]
Compare [option A] vs [option B]
Investigate this error: [error message]
```

**⚡ Crisis Mode** (Immediate help)
```
My app is down - help!
This query is too slow
I'm getting this critical error
```

**📈 Strategic Mode** (Growth planning)
```
How do I scale this feature?
Plan our architecture for 10x growth
Optimize our costs
```

**🎯 Truth Mode** (Honest feedback)
```
Be brutally honest about my code
What am I doing wrong here?
Truth bomb my architecture
```

### Getting the Most from Your Assistant

**❌ Vague**: *"My app is slow"*  
**✅ Specific**: *"This chat component is slow when scrolling through 1000+ messages. Help me optimize it."*

**❌ No context**: *"Fix this"*  
**✅ Contextual**: *"This authentication flow breaks on mobile Safari. Here's the error: [error]"*

**Learning Together:**
✅ "Explain why you chose this approach"  
✅ "Teach me the pattern you just used"  
✅ "Show me alternative solutions"

## 📊 Performance Optimization

**Quick Performance Audit:**
```
Audit my app's performance
```

Your assistant analyzes:
- Database query efficiency
- Component render patterns  
- Bundle size and loading
- API response times
- Core Web Vitals

## 🧪 Testing Strategy

**Comprehensive Test Planning:**
```
Create a testing plan for [feature]
```

Covers:
- Unit tests for logic
- Integration tests for workflows
- E2E tests for user journeys
- Performance benchmarks

## 🚨 Troubleshooting Common Issues

### Database Issues
```
My Supabase queries are failing
```

### Performance Problems
```
My app is loading slowly
```

### Authentication Issues  
```
Users can't log in
```

## 💡 Pro Development Tips

### 1. Share Context Early
- Recent error messages help your assistant understand issues quickly
- Current file contents provide better code suggestions  
- Recent terminal commands help your assistant understand your workflow

### 2. Iterate with Your Assistant
- Start with "I want to build [feature]"
- Let your assistant ask clarifying questions
- Build iteratively with feedback

### 3. Learn Patterns
- Ask "Show me the pattern for [use case]"
- Request explanations of architectural decisions
- Build your own pattern library over time

## 🎯 Next Steps

Ready to level up your Lovable development? Try these:

1. **Build Your First AI Feature**: `Dev Mode: create smart search for my app`
2. **Optimize Performance**: `Audit my app and suggest improvements`
3. **Add Real-time Features**: `Dev Mode: setup live notifications`
4. **Create Advanced UI**: `Dev Mode: build drag-and-drop dashboard`
5. **Implement Advanced Auth**: `Dev Mode: add role-based permissions`

Remember: Your AI assistant is here to make your development journey both productive and enjoyable. Don't hesitate to ask for help, explanations, or even just a friendly chat about your code!

---

*"Ship fast, learn faster, and have fun doing it!"* 🚀