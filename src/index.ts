// building an agent loop from scratch

import { createOpenAI, openai } from "@ai-sdk/openai"
import { generateText, isLoopFinished, type ModelMessage } from "ai"
import readline from "readline"
import { config } from "dotenv"
import { TOOLS } from "./utils/tools.js"

config()


export const WORKING_DIR = process.cwd()
console.log(WORKING_DIR)

// const ollama = createOpenAI({
//     apiKey : process.env.OPENAI_API_KEY!,
// })

// Agent Loop
const agentLoop = async (messages : ModelMessage[]) : Promise<string> => {
    const { text } = await generateText({
        model : openai("gpt-4o"),
        stopWhen : isLoopFinished(),
        system : `you are a coding agent at ${WORKING_DIR} . Use bash to solve task. ACT DON'T EXPLAIN
            Your current working directory is : ${WORKING_DIR}
            Use tools to solve the task. You have access to the following tools : ${Object.keys(TOOLS).join(", ")}
        `,
        messages,
        tools : TOOLS
    })

    return text
}

// Building the Interface
const rl = readline.createInterface({
    input : process.stdin,
    output : process.stdout
})

// adding dummy history to test the agent loop
export const HISTORY : ModelMessage[] = []
const runLoop = () : void => {
    rl.question(">>>input : ", async (query : string)=>{
        if(query.trim() === "exit"){
            console.log(HISTORY)
            rl.close()
            return
        }
        HISTORY.push({role : "user", content : query})

        const reply = await agentLoop(HISTORY)
        console.log(`\n Output : ${reply}`)
        HISTORY.push({role : "assistant", content : reply})
        console.log("\n")
        runLoop()
    })
}

runLoop()