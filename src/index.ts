// building an agent loop from scratch

import { createOpenAI } from "@ai-sdk/openai"
import { generateText, isLoopFinished, type ModelMessage } from "ai"
import path from "path"
import readline from "readline"

const currDir = import.meta.dirname
const WORKING_DIR = path.join(currDir, "..")
console.log(WORKING_DIR)

const ollama = createOpenAI({
    baseURL : "http://localhost:11434/v1",
    apiKey : "ollama"
})

// Agent Loop


const agentLoop = async (messages : ModelMessage[]) : Promise<string> => {
    const { text } = await generateText({
        model : ollama.chat("qwen:latest"),
        stopWhen : isLoopFinished(),
        system : `you are a coding agent at ${WORKING_DIR}`,
        messages
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