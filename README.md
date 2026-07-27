

https://github.com/user-attachments/assets/3de9964c-d5b3-4dad-873a-6dc8fb881af0



# Terminal Agent

A terminal-based AI agent built with the AI SDK that allows users to interact with their filesystem and execute commands using natural language.

## Features

- Natural language interface for file operations (read, write, edit)
- Ability to run bash commands
- Subagent delegation for complex tasks
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

Type `exit` to quit the agent.

## Project Structure

```
terminal-agent/
├── src/
│   ├── index.ts          # Main agent loop and REPL interface
│   └── utils/
│       ├── command.ts    # Tool implementations (bash, file operations, subagents)
│       ├── model.ts      # AI model configuration
│       ├── prompt.ts     # System prompts for the agent and subagents
│       └── tools.ts      # Tool definitions for the AI SDK
├── docs/
│   └── utils-overview.md # Detailed documentation of utility modules
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
5. The results are fed back to the model for further reasoning or to produce a final answer
6. The conversation history is maintained to allow for contextual interactions

## Tools Available

The agent provides the following tools to the underlying AI model:

- `bash`: Execute bash commands
- `readFile`: Read the contents of a file
- `writeFile`: Write content to a file (creates if doesn't exist, overwrites otherwise)
- `editFile`: Edit an existing file by replacing a specific string
- `runSubagent`: Delegate a task to a subagent for complex operations

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
