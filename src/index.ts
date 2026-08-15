#!/usr/bin/env node
import { generateText, isLoopFinished, type ModelMessage } from "ai"
import readline from "readline"
import * as fs from "node:fs"
import { ensureApiKey, saveKey } from "./utils/config.js"
import { config } from "dotenv"
import chalk from "chalk"
import { PARENT_TOOLS } from "./utils/tools.js"
import { model } from "./utils/model.js"
import { getRootSystemPrompt } from "./utils/prompt.js"
import { CONTEXT_LIMIT, estimateTokens, microCompaction, runCompaction } from "./utils/compact.js"
import ora from "ora"
import boxen from "boxen"
import { TODOS } from "./utils/tools.js"

config()

const dirs = fs.readdirSync(process.cwd())
// const ollama = createOpenAI({
//     apiKey : process.env.OPENAI_API_KEY!,
// })

// Agent Loop - now returns both text and steps
const agentLoop = async (messages: ModelMessage[]): Promise<{ text: string, steps: any[] }> => {
    ensureApiKey()
    // Note: We removed the console logs here to return the data for TUI display
    console.log(chalk.blue("Estimating tokens..."))
    console.log(chalk.blue(`Current token count: ${estimateTokens(messages)}`))
    const { text, steps } = await generateText({
        model: model,
        stopWhen: isLoopFinished(),
        system: getRootSystemPrompt(),
        messages,
        tools: PARENT_TOOLS
    })
    return { text, steps }
}

// Building the Interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

// adding dummy history to test the agent loop
export const HISTORY: ModelMessage[] = []

const displayWelcomeBanner = () => {
    console.log(chalk.blue.bold(
        boxen('Welcome to XYZ Agent', {
            padding: 1,
            margin: 1,
            borderStyle: 'double',
            borderColor: 'blue'
        })
    ))
    console.log()
}

const displayTodos = () => {
    if (TODOS.length === 0) {
        console.log(chalk.yellow('Todos: (no todos)'))
    } else {
        console.log(chalk.yellow.bold('Todos:'))
        TODOS.forEach((todo) => {
            const status = todo.status === "completed" ? chalk.green('[x]') :
                todo.status === "in_progress" ? chalk.blue('[>]') :
                    todo.status === "failed" ? chalk.red('[x]') :
                        chalk.dim('[ ]')
            console.log(`  ${status} ${todo.title}`)
        })
    }
    console.log()
}

const runLoop = (): void => {
    rl.question(chalk.green.bold(">>>INPUT : "), async (query: string) => {
        if (query.trim() === "exit") {
            console.log(chalk.blue("History:"), HISTORY)
            rl.close()
            return
        }
        // helo the user to type exit
        if (query.trim() === "help") {
            console.log(chalk.blue("Type 'exit' to quit the application."))
            console.log(chalk.blue("Type '/setkey <your_api_key>' to set your OpenAI API key."))
        }

        console.log(chalk.blue(`Type 'exit' to quit the application. Type '/setkey <your_api_key>' to set your OpenAI API key.`))
        // handle /setkey command to set the OpenAI API key
        if (query.startsWith('/SETKEY') || query.startsWith('/setkey')) {
            const parts = query.split(' ')
            const key = parts[1]

            if (key) {
                // key passed inline: /setkey sk-...
                saveKey(key)
                process.env.OPENAI_API_KEY = key
                console.log(chalk.green("API key saved.\n"))
                runLoop()
                return
            }

            // no key passed inline: prompt for it on the next line
            rl.question(chalk.green.bold("Enter your OpenAI API key: "), (answer) => {
                const trimmed = answer.trim()
                if (!trimmed) {
                    console.log(chalk.red("No key entered.\n"))
                    runLoop()
                    return
                }
                saveKey(trimmed)
                process.env.OPENAI_API_KEY = trimmed
                console.log(chalk.green("API key saved.\n"))
                runLoop()
            })
            return
        }
        // Handle todo commands
        if (query.startsWith('/todo')) {
            const parts = query.split(' ')
            if (parts[1] === 'add' && parts[2]) {
                // We'll use the update_todos tool through the agent loop instead of direct manipulation
                console.log(chalk.yellow('Please use the agent to add todos via the update_todos tool'))
            } else if (parts[1] === 'remove' && parts[2]) {
                console.log(chalk.yellow('Please use the agent to remove todos via the update_todos tool'))
            } else if (parts[1] === 'done' && parts[2]) {
                console.log(chalk.yellow('Please use the agent to mark todos as done via the update_todos tool'))
            } else if (parts[1] === 'list') {
                // Just fall through to display todos
            } else {
                console.log(chalk.red('Unknown todo command. Use: /todo add <text>, /todo remove <id>, /todo done <id>, /todo list'))
            }
            displayTodos()
            runLoop()
            return
        }

        HISTORY.push({ role: "user", content: query })

        // Show thinking spinner
        const spinner = ora('Agent is thinking...').start()
        const { text, steps } = await agentLoop(HISTORY)
        spinner.stop()

        // Display user input in a box
        console.log(boxen(`User: ${query}`, {
            borderColor: 'green',
            padding: 1,
            margin: 1
        }))

        displayTodos()
        // Display agent's thought process (tool calls/results) in a box
        let stepsOutput = ''
        for (const step of steps) {
            stepsOutput += `TOOL CALLS: ${JSON.stringify(step.toolCalls).slice(0, 100)}\n`
            stepsOutput += `TOOL RESULTS: ${JSON.stringify(step.toolResults).slice(0, 100)}\n`
            stepsOutput += '='.repeat(30) + '\n'
        }
        console.log(boxen(stepsOutput || 'No tool calls made', {
            borderColor: 'yellow',
            padding: 1,
            margin: 1
        }))

        // Display agent's final response in a box
        console.log(boxen(`Agent: ${text}`, {
            borderColor: 'blue',
            padding: 1,
            margin: 1
        }))

        // Update history with agent's response
        HISTORY.push({ role: "assistant", content: text })
        console.log("\n")

        // Display todos

        runLoop()
    })
}

// Start the application
displayWelcomeBanner()
runLoop()