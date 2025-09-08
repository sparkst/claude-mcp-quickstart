# Core Prompt Engineering Rules

## The Golden Rules

### 1. Role Before Task
Always define WHO the AI is before WHAT it should do.

```
# Good
You are an expert data analyst specializing in e-commerce metrics.
Your task is to analyze this sales data...

# Bad  
Analyze this sales data like an expert...
```

### 2. Context is King
Provide sufficient background without overwhelming.

```
# Optimal Context Structure
ROLE: [Who the AI is]
CONTEXT: [Relevant background]
TASK: [Specific objective]
CONSTRAINTS: [Boundaries and limits]
OUTPUT: [Expected format]
EXAMPLES: [1-3 clear examples]
```

### 3. Be Specific, Not Vague

```
# Vague (Bad)
Write a good blog post

# Specific (Good)
Write a 600-800 word blog post about remote work productivity tips
for software developers, using a conversational tone, including
3 actionable tips with examples
```

### 4. Show, Don't Just Tell
Examples > Descriptions

```
# Good Prompt with Example
Format responses as JSON with this structure:
{
  "summary": "Brief overview",
  "key_points": ["point1", "point2"],
  "confidence": 0.95
}
```

## Structured Prompt Templates

### Basic Template
```
You are [ROLE].

Your task is to [SPECIFIC_TASK].

Context:
[RELEVANT_BACKGROUND]

Constraints:
- [CONSTRAINT_1]
- [CONSTRAINT_2]

Output format:
[EXACT_FORMAT_NEEDED]

Example:
[EXAMPLE_INPUT]
[EXAMPLE_OUTPUT]
```

### Multi-Agent Coordinator
```
You are an orchestrator managing multiple AI agents.

Available agents:
- Researcher: Finds and validates information
- Writer: Creates content
- Reviewer: Checks quality and accuracy

For this request: [USER_REQUEST]

Determine:
1. Which agents are needed
2. In what order
3. What each should produce

Output a workflow plan.
```

### Chain-of-Thought Template
```
You are [ROLE].

Think through this step-by-step:
1. First, [STEP_1]
2. Then, [STEP_2]
3. Finally, [STEP_3]

Show your reasoning for each step.
```

## Output Control Techniques

### 1. Format Locking
```
ALWAYS respond with exactly this structure:
<analysis>
[Your analysis here]
</analysis>
<recommendation>
[Your recommendation here]
</recommendation>
<confidence>
[0.0-1.0 score]
</confidence>
```

### 2. Token Budget Management
```
Provide a comprehensive answer in exactly:
- 3 bullet points (50 words each)
- 1 example (100 words)
- 1 summary sentence (25 words)
Total: ~275 words maximum
```

### 3. Style Consistency
```
Write in this style:
- Short sentences (max 20 words)
- Active voice only
- No adjectives except for technical precision
- One idea per paragraph
```

## Advanced Techniques

### 1. Few-Shot Learning
```
Here are examples of the task:

Input: "Calculate ROI for $1000 investment returning $1500"
Output: "ROI: 50% (($1500-$1000)/$1000 × 100)"

Input: "Calculate ROI for $5000 investment returning $6500"
Output: "ROI: 30% (($6500-$5000)/$5000 × 100)"

Now calculate: [NEW_INPUT]
```

### 2. Self-Critique Loop
```
1. Generate your initial response
2. Critique your response for:
   - Accuracy
   - Completeness
   - Clarity
3. Provide an improved version
4. Rate your confidence (0-1)
```

### 3. Conditional Branching
```
IF the input contains personal data:
  Respond with: "I cannot process personal information"
ELSE IF the input is a question:
  Provide a detailed answer with sources
ELSE IF the input is a task:
  Break it down into steps
ELSE:
  Ask for clarification
```

## Common Pitfalls & Solutions

### Pitfall 1: Ambiguous Instructions
```
# Bad
Make it better

# Good
Improve this text by:
1. Fixing grammar errors
2. Making sentences more concise
3. Adding transition words between paragraphs
```

### Pitfall 2: Conflicting Requirements
```
# Bad
Be brief but comprehensive

# Good
Provide a 200-word summary covering these 3 key points:
1. [Point 1]
2. [Point 2]  
3. [Point 3]
```

### Pitfall 3: No Success Criteria
```
# Bad
Write good documentation

# Good
Write documentation that:
- A junior developer can follow
- Includes code examples for each function
- Has troubleshooting section
- Takes 5 minutes to read
```

## Prompt Optimization Checklist

- [ ] Role clearly defined
- [ ] Task is specific and measurable
- [ ] Context provided without overload
- [ ] Constraints explicitly stated
- [ ] Output format specified
- [ ] Examples included where helpful
- [ ] Success criteria defined
- [ ] Edge cases addressed
- [ ] Tone/style specified
- [ ] Token budget considered

## Model-Specific Optimizations

### GPT-4o
- Excels at complex reasoning
- Use chain-of-thought for difficult problems
- Can handle long contexts well

### GPT-4o-mini
- Best for simple, high-volume tasks
- Keep prompts concise
- Great for structured data extraction

### Claude 3.5 Sonnet
- Superior for nuanced writing
- Handles very long contexts
- Excellent at following complex instructions

### Local Models (Ollama)
- Optimize for simplicity
- Provide more examples
- Use simpler vocabulary

## Testing Your Prompts

### 1. Edge Case Testing
Test with:
- Minimal input
- Maximum input
- Unusual formatting
- Missing information
- Contradictory requirements

### 2. Consistency Testing
Run same prompt 5 times:
- Should produce similar quality
- Format should be identical
- Key information consistent

### 3. Failure Mode Testing
- What happens with invalid input?
- How does it handle ambiguity?
- Does it fail gracefully?

## Prompt Versioning

Always version your prompts:
```
# v1.0.0 - Initial prompt
# v1.0.1 - Fixed formatting issue
# v1.1.0 - Added examples section
# v2.0.0 - Complete restructure for clarity
```

## Meta-Prompting

For prompt improvement:
```
Review this prompt and suggest improvements:
[YOUR_PROMPT]

Consider:
1. Clarity of instructions
2. Potential ambiguities
3. Missing constraints
4. Output format issues
5. Efficiency opportunities
```

---

*Remember: The best prompt is the one that consistently produces the output you need with minimal tokens and maximum reliability.*
