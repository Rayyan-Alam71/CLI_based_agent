

https://github.com/user-attachments/assets/3de9964c-d5b3-4dad-873a-6dc8fb881af0



# Terminal Agent

A terminal-based AI agent built with the AI SDK that allows users to interact with their filesystem and execute commands using natural language.

## Features

- Natural language interface for file operations (read, write, edit)
- Ability to run bash commands
- Subagent delegation for complex tasks
- Persistent task tracking with write/read/edit task tools
- Task state saved to `.tasks/task.json` for multi-step workflows
- Interactive REPL loop
- Built with TypeScript and the AI SDK
- Comprehensive documentation available in `/docs` directory

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rayyan-Alam71/CLI_based_agent.git
   cd terminal-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Ensure you have the necessary API keys in a `.env` file (see Configuration).

## Configuration

Copy `.env.example` into `.env` file and put your OPENAI_API_KEY there.

```
OPENAI_API_KEY=your_openai_api_key_here
```

Note: The project currently uses the OpenAI API via the AI SDK. You may need to adjust the model configuration in `src/utils/model.ts` if you wish to use a different provider.

## Usage

Start the agent:

```bash
npm start
```

Or directly:

```bash
node dist/index.js
```

You will be presented with a prompt:

```
>>>INPUT : 
```

You can now interact with the agent using natural language. For example:

- "Read the file `src/index.ts`"
- "Write a file `hello.txt` with content 'Hello World'"
- "List the files in the current directory"
- "Run the command `ls -la`"
- "Create a subagent to summarize the contents of the src directory"
- "Create a persistent task list for implementing a new feature"
- "Read the current tasks"
- "Update the status of task 1 to in_progress"

Type `exit` to quit the agent.

## Project Structure

```
terminal-agent/
├── src/
│   ├── index.ts          # Main agent loop and REPL interface
│   ├── task/
│   │   ├── taskUtils.ts  # Task persistence helpers for read/write/edit task operations
│   │   └── types.ts      # Task-related TypeScript types
│   └── utils/
│       ├── command.ts    # Tool implementations (bash, file operations, subagents)
│       ├── model.ts      # AI model configuration
│       ├── prompt.ts     # System prompts for the agent and subagents
│       └── tools.ts      # Tool definitions for the AI SDK
├── docs/
│   └── utils-overview.md # Detailed documentation of utility modules
├── .tasks/
│   └── task.json         # Persisted task state created by the agent
├── node_modules/
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

The agent uses a loop that:

1. Reads user input from the terminal
2. Sends the input (along with conversation history) to an AI language model
3. The model decides which tools to use based on the available tools defined in `src/utils/tools.ts`
4. The agent executes the selected tools (file operations, bash commands, subagent creation)
5. For long-running or multi-step work, it can persist task state using the task tools and store it in `.tasks/task.json`
6. The results are fed back to the model for further reasoning or to produce a final answer
7. The conversation history is maintained to allow for contextual interactions

## Tools Available

The agent provides the following tools to the underlying AI model:

- `bash`: Execute bash commands
- `read_file`: Read the contents of a file
- `write_file`: Write content to a file (creates if doesn't exist, overwrites otherwise)
- `edit_file`: Edit an existing file by replacing a specific string
- `build_project`: Build the project to check for TypeScript or compile errors
- `update_todos`: Manage an in-memory todo list for complex multi-step work
- `write_task`: Create or replace the persisted task list in `.tasks/task.json`
- `read_task`: Read the persisted task list from `.tasks/task.json`
- `edit_task`: Update an existing task entry incrementally as work progresses
- `subAgent`: Delegate a task to a subagent for complex operations

## Task Persistence

For multi-step tasks, the agent can persist a task record between turns. The workflow is:

1. Use `read_task` to inspect the current task list
2. Use `edit_task` to update existing tasks as progress changes
3. Use `write_task` when creating a fresh task snapshot or replacing the full task list

Task data is stored in `.tasks/task.json`, which makes it easier to resume long-running work without losing context.

## Documentation

Detailed documentation of the utility modules is available in the `/docs` directory:
- [Utils Module Overview](docs/utils-overview.md) - Comprehensive guide to the utility modules (`command.ts`, `model.ts`, `prompt.ts`, `tools.ts`)

## Configuration Details

### Model Configuration (`src/utils/model.ts`)

The model is currently configured to use OpenAI's GPT-4 model via the AI SDK. You can modify this to use other providers supported by the AI SDK.

### System Prompts (`src/utils/prompt.ts`)

- `getRootSystemPrompt()`: Defines the behavior of the main agent
- `getSubagentSystemPrompt()`: Defines the behavior of subagents

## Development

To modify the agent and rebuild:

1. Make changes to the TypeScript source in the `src/` directory
2. Run `npm run build` to compile to JavaScript in the `dist/` directory
3. Run the agent as described in the Usage section

## Dependencies

- `ai`: The AI SDK for building AI-powered applications
- `@ai-sdk/openai`: OpenAI provider for the AI SDK
- `dotenv`: For loading environment variables
- `zod`: For schema validation (used with the AI SDK)
- `@types/node`: TypeScript definitions for Node.js (dev dependency)

## License

ISC

## Acknowledgments

- Built with the [AI SDK](https://sdk.vercel.ai/docs)
- Inspired by the Claude Code CLI and similar agent frameworks

