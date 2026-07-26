// building an agent loop from scratch

import { createOpenAI, openai } from "@ai-sdk/openai"
import { generateText, isLoopFinished, type ModelMessage, tool, zodSchema } from "ai"
import {string, z} from "zod"
import path from "path"
import readline from "readline"
import { runBash } from "./utils/command.js"
import { config } from "dotenv"

config()


const currDir = import.meta.dirname
const WORKING_DIR = path.join(currDir, "..")
console.log(WORKING_DIR)

const ollama = createOpenAI({
    apiKey : process.env.OPENAI_API_KEY!,
})



// TOOLS
const TOOLS = {
    bash : tool({
        description : "Run a shell command",
        inputSchema : zodSchema(z.object({command : z.string()})),
        execute : (async ({command} : {command : string})=>{
            const output = runBash(command)
            return output
        })
    })
}

// Agent Loop
const agentLoop = async (messages : ModelMessage[]) : Promise<string> => {
    const { text } = await generateText({
        model : openai("gpt-4o"),
        stopWhen : isLoopFinished(),
        system : `you are a coding agent at ${WORKING_DIR} . Use bash to solve task. ACT DON'T EXPLAIN
            Your current working directory is : ${WORKING_DIR}
            Do not use tool if asked for to look for current working directory
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
const HISTORY : ModelMessage[] = []
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