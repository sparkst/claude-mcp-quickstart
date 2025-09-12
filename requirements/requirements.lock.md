# Requirements Lock

## REQ-301: Streamlined Connection Output
- Acceptance: Replace verbose brain connection output with clean, scannable professional messaging
- Acceptance: Display full file paths instead of basenames in all user instructions
- Acceptance: Eliminate repetitive text and focus on clear next steps
- Non-Goals: Changing core functionality, breaking existing security measures
- Notes: Current output has 7+ lines of verbose text that users find overwhelming

## REQ-302: Intelligent Setup Verification
- Acceptance: Analyze actual Claude desktop configuration to detect what's configured vs missing
- Acceptance: Check for mandatory Filesystem access and workspace path configuration
- Acceptance: Detect optional extensions (Context7, GitHub) and provide setup guidance
- Acceptance: Generate targeted troubleshooting steps for common misconfigurations
- Non-Goals: Automatically fixing configurations, modifying Claude settings files
- Notes: Users often forget to configure Filesystem access to their workspace

## REQ-303: Enhanced Prompt Content Generation
- Acceptance: Replace generic brain connection content with practical, actionable examples
- Acceptance: Include 10 specific MCP-enhanced prompts users can try immediately
- Acceptance: Showcase 10 unique capabilities unlocked by MCP setup
- Acceptance: Provide copy-paste ready examples for Supabase and memory usage
- Non-Goals: Overwhelming users with too many options, breaking template security
- Notes: Current prompt is too generic and doesn't showcase MCP value

## REQ-304: Configuration Analysis Engine
- Acceptance: Parse claude_desktop_config.json to determine actual server states
- Acceptance: Detect filesystem server configuration and workspace paths
- Acceptance: Identify missing recommended extensions with specific setup guidance
- Acceptance: Handle malformed configuration files gracefully
- Non-Goals: Modifying configuration files, installing missing tools
- Notes: Must reuse existing config validation patterns from setup.js

## REQ-305: Professional UX Messaging
- Acceptance: Replace unix-style command output with professional developer tool messaging
- Acceptance: Use consistent visual hierarchy and chalk color patterns
- Acceptance: Provide specific, actionable guidance instead of generic suggestions
- Acceptance: Maintain existing security and error handling patterns
- Non-Goals: Changing core CLI architecture, breaking existing workflows
- Notes: Users expect polished experience similar to modern developer tools

## REQ-306: Full File Path Display
- Acceptance: Show complete file paths in all user instructions and guidance
- Acceptance: Replace relative paths and basenames with absolute paths
- Acceptance: Make file locations copy-paste ready for user convenience
- Non-Goals: Changing file locations, breaking existing path resolution
- Notes: Users need exact paths to easily locate and use generated files

## REQ-307: Practical Example Library
- Acceptance: Generate 10 actionable MCP prompts covering common development tasks
- Acceptance: Include specific Supabase design check and table update examples
- Acceptance: Show explicit memory saving and retrieval examples
- Acceptance: All examples must be copy-paste ready and immediately useful
- Non-Goals: Creating exhaustive documentation, replacing existing docs
- Notes: Examples should demonstrate clear value proposition of MCP setup

## REQ-308: MCP Capability Showcase
- Acceptance: Highlight 10 specific capabilities enabled by MCP that weren't possible before
- Acceptance: Focus on meaningful, practical benefits rather than technical features
- Acceptance: Connect capabilities to user's actual project context and setup
- Non-Goals: Marketing copy, overwhelming technical detail
- Notes: Users need to understand ROI of setup effort immediately

## REQ-309: Robust Configuration Parsing
- Acceptance: Handle missing, malformed, or incomplete Claude configuration files
- Acceptance: Provide specific error messages for configuration issues
- Acceptance: Gracefully degrade when configuration analysis fails
- Acceptance: Follow existing error handling and security patterns
- Non-Goals: Fixing configuration files automatically, bypassing Claude security
- Notes: Must be resilient to user environment variations and edge cases

## REQ-310: Targeted Troubleshooting System
- Acceptance: Detect common setup failures (missing filesystem, invalid tokens, etc.)
- Acceptance: Provide specific, step-by-step resolution guidance
- Acceptance: Handle edge cases like multiple Claude installations or custom configs
- Acceptance: Generate troubleshooting content that's context-aware
- Non-Goals: Debugging Claude itself, fixing system-level issues
- Notes: Focus on issues within our control and common user mistakes