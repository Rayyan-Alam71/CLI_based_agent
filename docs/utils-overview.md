# Utils Folder Overview

This document provides a detailed overview of the utility modules in the `src/utils/` directory, which form the core functionality of the terminal agent.

## Module Overview

The utils module consists of four tightly integrated files:

1. **`command.ts`** - Core implementation of all agent tools and utilities
2. **`model.ts`** - AI model configuration and workspace configuration
3. **`prompt.ts`** - System prompt generation for agents and subagents
4. **`tools.ts`** - AI SDK tool definitions that bridge the AI model to command implementations

## Detailed Module Breakdown

### command.ts
The core implementation layer containing all functional utilities.

#### Security Functions
- **`checkPathSafety(filePath: string)`**
  - **Purpose**: Prevents directory traversal attacks by ensuring file paths stay within WORKING_DIR
  - **Implementation**: Uses `path.resolve()` to get absolute path and checks if it starts with WORKING_DIR
  - **Security**: Throws error if path attempts to escape working directory

#### File Operations
- **`runReadFile(filePath: string, limit?: number)`**
  - **Purpose**: Safely read file contents with optional line limiting
  - **Security**: Uses `checkPathSafety` before reading
  - **Limits**: Returns max 50k characters to prevent LLM context overflow
  - **Returns**: File content as string or error message

- **`runWriteFile(filepath: string, content: string)`**
  - **Purpose**: Write content to file, creating directories as needed
  - **Security**: Uses `checkPathSafety` before writing
  - **Directory Creation**: Uses `fs.mkdirSync(recursive:true)` for nested paths
  - **Returns**: Success message or error

- **`runEditFile(filepath: string, oldContent: string, newContent: string)`**
  - **Purpose**: Replace specific content within a file
  - **Security**: Uses `checkPathSafety` before reading/writing
  - **Validation**: Returns error if `oldContent` not found in file
  - **Returns**: Success message or error

#### Command Execution
- **`runBash(command: string)`**
  - **Purpose**: Execute shell commands with security filtering
  - **Security**: Blocks dangerous commands (`sudo`, `rm -rf /`, `shutdown`, `reboot`)
  - **Execution**: Uses `spawnSync` with 120-second timeout
  - **Output**: Returns trimmed stdout+stderr (max 50k chars) or error message

#### Subagent Management
- **`getSubagentMessages(prompt: string)`**
  - **Purpose**: Create message array for subagent initialization
  - **Returns**: Array with system prompt (defining subagent role) and user prompt

- **`runSubagent(prompt: string)`**
  - **Purpose**: Spawn and execute a subagent for complex tasks
  - **Implementation**: Uses AI SDK's `generateText` with subagent-specific tools and prompt
  - **Returns**: Subagent's text response summarizing its work

### model.ts
Configuration module providing shared constants.

#### Exports
- **`model`**: Configured OpenAI GPT-4o model instance via `@ai-sdk/openai`
- **`WORKING_DIR`**: Current working directory (`process.cwd()`), used for path safety checks

### prompt.ts
System prompt generation for guiding agent behavior.

#### Functions
- **`getRootSystemPrompt()`**
  - **Purpose**: Defines behavior for the main agent
  - **Key Instructions**:
    - Act as a coding agent in the current working directory
    - "ACT, DON'T EXPLAIN" - use tools to solve tasks step by step
    - Spawn subagents for complex tasks (investigation, multi-file operations, >5 tool calls, independent objectives)
    - Don't spawn subagents for simple read/write/edit operations
    - Lists available tools (from PARENT_TOOLS)
    - Shows current working directory

- **`getSubagentSystemPrompt()`**
  - **Purpose**: Defines behavior for subagents
  - **Key Instructions**:
    - Act as a subagent with a specific task
    - "ACT, DON'T EXPLAIN" - focus on task completion
    - Use available tools to complete task efficiently
    - Lists available tools (from TOOLS)
    - Shows current working directory

### tools.ts
AI SDK tool definitions that connect the language model to command implementations.

#### Tool Definitions
- **`TOOLS`**: Available to subagents
  - **`bash`**: Executes shell commands (maps to `runBash`)
    - Description: "Run a shell command"
    - Input: `{ command: string }`
  - **`read_file`**: Reads file contents (maps to `runReadFile`)
    - Description: "Read a file with given filepath"
    - Input: `{ filepath: string, limit?: number }`
  - **`write_file`**: Writes content to files (maps to `runWriteFile`)
    - Description: "Write content to a file"
    - Input: `{ filepath: string, content: string }`
  - **`edit_file`**: Edits existing file content (maps to `runEditFile`)
    - Description: "Edit the content of an existing file with the new content"
    - Input: `{ filepath: string, oldContent: string, newContent: string }`

- **`PARENT_TOOLS`**: Available to main agent (includes all TOOLS plus)
  - **`subAgent`**: Spawns subagents for complex tasks (maps to `runSubagent`)
    - Description: "This will spawn a subagent with arrowed single task to perform"
    - Input: `{ prompt: string }`

## Inter-Module Dependencies

### Data Flow
```
AI Model (using model.ts)
        ↓
tools.ts (tool definitions)
        ↓
command.ts (function implementations)
        ↓
Actual operations (file system, shell, etc.)
```

### Specific Dependencies
1. **tools.ts → command.ts**: Each tool's `execute` handler calls a function from command.ts
2. **prompt.ts → model.ts**: Uses `WORKING_DIR` constant in system prompts
3. **command.ts → model.ts**: Uses `model` constant for AI operations in `runSubagent`
4. **All modules → model.ts**: Indirectly through shared `WORKING_DIR` constant

## Data Flow Examples

### File Read Operation
1. AI decides to use `read_file` tool
2. tools.ts routes to `runReadFile` in command.ts
3. command.ts validates path with `checkPathSafety`
4. command.ts reads file with `fs.readFileSync`
5. Result returned to AI through tools.ts interface

### Subagent Creation
1. AI decides to use `subAgent` tool
2. tools.ts routes to `runSubagent` in command.ts
3. command.ts creates messages using `getSubagentMessages`
4. command.ts calls AI SDK's `generateText` with subagent-specific prompt and tools
5. Subagent result returned to main agent

## Security Considerations

### Path Safety
- All file operations use `checkPathSafety` to prevent directory traversal
- Works by ensuring resolved paths start with `WORKING_DIR`

### Command Security
- `runBash` blocks specific dangerous commands:
  - `sudo` - prevents privilege escalation
  - `rm -rf /` - prevents system destruction
  - `shutdown`, `reboot` - prevents system disruption

### Output Limiting
- File reads limited to 50k characters to prevent LLM context overflow
- Command output similarly limited

## Improvement Recommendations

### Immediate Improvements
1. **Enhanced Command Security**
   - Expand blocked commands list in `runBash` to include:
     - `mkfs`, `dd`, `>:`, `>|`, `chmod -R 777 /`, etc.
   - Consider implementing a whitelist approach for allowed commands instead

2. **Improved Error Handling**
   - Add more specific error types/messages in file operations
   - Distinguish between different error types (file not found, permission denied, etc.)

3. **Input Validation**
   - Add stricter validation for file paths (length, character restrictions)
   - Validate command inputs for common injection patterns

### Architectural Improvements
1. **Tool Documentation Enhancement**
   - Add JSDoc comments to all functions in command.ts
   - Include parameter descriptions, return values, and possible exceptions

2. **Configuration Flexibility**
   - Make model configurable via environment variables
   - Allow custom working directory configuration

3. **Testing Infrastructure**
   - Add unit tests for all utility functions
   - Create mock filesystem tests for file operations
   - Add integration tests for tool chains

4. **Type Safety Improvements**
   - Add more specific return types where `any` or `unknown` is used
   - Consider using branded types for file paths to prevent mixing relative/absolute

### Performance Considerations
1. **File Operation Optimization**
   - Consider streaming for large file operations
   - Add caching for frequently accessed files (with appropriate invalidation)

2. **Subagent Efficiency**
   - Implement subagent pooling for frequent similar tasks
   - Add timeout and cancellation mechanisms for long-running subagents

## Usage Guidelines

### For Developers Extending the Agent
1. **Adding New Tools**:
   - Implement function in command.ts
   - Add tool definition to tools.ts (TOOLS or PARENT_TOOLS)
   - Update relevant system prompts if needed

2. **Modifying Security**:
   - Update `BLOCKED_COMMANDS` array in command.ts
   - Enhance `checkPathSafety` for more sophisticated path validation

3. **Changing AI Models**:
   - Modify model.ts to export different model configuration
   - Ensure compatibility with AI SDK tool interface

### Security Best Practices
1. Never disable path safety checks
2. Regularly update blocked commands list
3. Consider implementing audit logging for sensitive operations
4. Review and validate all user-provided inputs before processing

## Conclusion

The utils module provides a solid, secure foundation for the terminal agent's capabilities. The separation of concerns between tool definition (tools.ts), implementation (command.ts), configuration (model.ts), and behavioral guidance (prompt.ts) creates a maintainable and extensible architecture. The security-first approach, particularly in path validation and command filtering, demonstrates careful consideration of the risks inherent in AI-powered system interaction.