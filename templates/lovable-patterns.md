# Lovable Development Patterns - Quick Reference

## 🎯 Pattern Selection Guide

### Chat Interfaces
```
"Dev Mode: create streaming chat with Supabase"
→ WebSocket + Realtime + Token streaming
→ Message history with pagination
→ Typing indicators and status
```

### Authentication Systems
```
"Dev Mode: setup auth flow"
→ Supabase Auth + RLS policies
→ Protected routes with redirects
→ User profile management
```

### Real-time Features  
```
"Dev Mode: add live notifications"
→ Supabase Realtime subscriptions
→ Toast notifications with state
→ Event-driven architecture
```

### Dashboard & Analytics
```
"Dev Mode: build analytics dashboard"
→ Chart.js/Recharts integration
→ Real-time data streaming
→ Export functionality
```

### Search & Filtering
```
"Dev Mode: create smart search"
→ Full-text search with Postgres
→ Vector similarity (embeddings)
→ Filtered results with pagination
```

## 🏗️ Architecture Patterns

### Supabase-First Architecture
- **Database-First**: Schema drives application structure
- **RLS-First**: Row Level Security for all tables
- **Realtime-First**: Live updates for collaborative features
- **Function-First**: Database functions for complex operations

### Component Architecture
- **Compound Components**: Complex UI with multiple parts
- **Render Props**: Flexible component composition
- **Custom Hooks**: Reusable stateful logic
- **Context + Reducer**: Predictable state management

### Data Flow Patterns
- **Optimistic Updates**: Immediate UI feedback
- **Cache Synchronization**: Client-server state consistency
- **Offline-First**: Works without connection
- **Progressive Enhancement**: Baseline → enhanced experience

## 📱 Common Lovable UI Patterns

### Form Handling
```
const { register, handleSubmit, formState: { errors } } = useForm();
const { mutate: createItem, isLoading } = useMutation({
  mutationFn: (data) => supabase.from('items').insert(data),
  onSuccess: () => {
    toast.success('Item created!');
    queryClient.invalidateQueries(['items']);
  }
});
```

### Real-time Subscriptions
```
useEffect(() => {
  const subscription = supabase
    .channel('public:messages')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => setMessages(prev => [...prev, payload.new])
    )
    .subscribe();
  
  return () => subscription.unsubscribe();
}, []);
```

### Error Boundaries
```
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <ErrorFallback onRetry={() => setHasError(false)} />;
  }
  
  return children;
}
```

## 🔧 Development Workflow Patterns

### Feature Development Flow
1. **Schema First**: Design database tables and relationships
2. **RLS Policies**: Define security at data level
3. **API Layer**: Create type-safe client functions
4. **UI Components**: Build reusable interface elements
5. **Integration**: Connect UI to data with error handling
6. **Testing**: Unit tests for logic, integration for workflows

### Performance Patterns
- **Code Splitting**: Load components only when needed
- **Image Optimization**: WebP, lazy loading, proper sizing
- **Database Optimization**: Indexes, efficient queries, connection pooling
- **Caching Strategy**: Browser cache, CDN, query cache

*Pro tip: Start with "Which pattern should I use for [feature]?" to get personalized recommendations based on your specific use case.*