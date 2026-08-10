// building an agent loop from scratch

import { createOpenAI, openai } from "@ai-sdk/openai"
import { generateText, isLoopFinished, type ModelMessage } from "ai"
import readline from "readline"
import * as fs from "node:fs"
import { config } from "dotenv"
import { PARENT_TOOLS, TOOLS } from "./utils/tools.js"
import { model } from "./utils/model.js"
import { getRootSystemPrompt } from "./utils/prompt.js"

config()

const dirs = fs.readdirSync(process.cwd())
console.log(dirs)
// const ollama = createOpenAI({
//     apiKey : process.env.OPENAI_API_KEY!,
// })

// Agent Loop
const agentLoop = async (messages : ModelMessage[]) : Promise<string> => {
    const { text, steps } = await generateText({
        model : model,
        stopWhen : isLoopFinished(),
        system : getRootSystemPrompt(),
        messages,
        tools : PARENT_TOOLS
    })
    console.log("*".repeat(50))
    for(const step of steps){
        console.log(step.toolCalls)
        console.log(step.toolResults)
        console.log("=".repeat(30))
    }
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
    rl.question(">>>INPUT : ", async (query : string)=>{
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