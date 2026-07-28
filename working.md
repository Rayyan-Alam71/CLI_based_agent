# Working Documentation for Terminal Agent

## Main Features
- **Natural Language Interface:** Allows users to perform file operations like read, write, and edit using natural language.
- **Command Execution:** Capable of executing bash commands directly from the terminal.
- **Subagent Delegation:** Supports delegation for handling complex tasks through subagents.
- **Interactive REPL Loop:** Provides a command-line interface for user interaction.
- **Built with TypeScript:** Utilizes TypeScript for building robust and scalable applications.
- **Comprehensive Documentation:** Extensive documentation is available in the `/docs` directory.

## Installation Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rayyan-Alam71/CLI_based_agent.git
   cd terminal-agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **API Key Configuration:**
   - Copy `.env.example` to `.env` and add your `OPENAI_API_KEY`.
   
     ```plaintext
     OPENAI_API_KEY=your_openai_api_key_here
     ```

## Available CLI Commands
- **Build:**
  ```bash
  npm run build
  ```
  Compiles the TypeScript files into JavaScript.

- **Start the Application:**
  ```bash
  npm start
  ```
  Starts the application using the compiled JavaScript files.

- **Run Terminal Agent Directly:**
  After building, you can run the agent directly:
  ```bash
  terminal-agent
  ```

- **Test Command:** *(Placeholder)*
  ```bash
  npm test
  ```
  Currently outputs an error as test scripts are not specified.

Refer to the README file or the documentation in the `docs` directory for more detailed instructions and advanced configurations.