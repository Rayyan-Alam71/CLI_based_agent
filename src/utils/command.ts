import { spawnSync } from "child_process"
import * as fs from "node:fs"
import path from "node:path"
import { generateText, isLoopFinished, type ModelMessage } from "ai"
import { TOOLS } from "./tools.js"
import { model, WORKING_DIR } from "./model.js"
import { getSubagentSystemPrompt } from "./prompt.js"

// const BLOCKED_COMMANDS = ["sudo", "rm -rf /", "shutdown", "reboot"]

const BLOCKED_COMMANDS = new Set([
    "rm", 
    "sudo",
    "chmod",
    "chown",
    "shutdown",
    "reboot",
    "mkfs"
])

const BLOCKED_DIRS = [
    "node_modules",
    "dist",
    ".git",
    "converage",
    ".next"
]

function validatePath(filepath : string){
    // filepath => src/index.ts
    // check if the file_access_tools has access to this dir. 

    const absolute = path.resolve(WORKING_DIR, filepath)
    // absolute => C:\Users\Desktop\terminal-agent\src\index.ts

    // this checks if the file is in the current prj. folder
    if(!absolute.startsWith(WORKING_DIR)){
        throw new Error("Path escapes project root")
    }


    // now check if the dir in the path is allowd
    const relative = path.relative(WORKING_DIR, filepath)

    // C:\Users\Desktop\terminal-agent\src\index.ts => \src\index.ts
    const firstDir = relative.split(path.sep)[0] // node_modules | dist | src etc.

    if(BLOCKED_DIRS.includes(firstDir!)){
        throw new Error(`Access to ${firstDir} is forbidded`)
    }

    return absolute
}

function referencesBlockedPath(command : string){
    // check if this path is allowed to be referenced for bash command

    return BLOCKED_DIRS.some(path => command.includes(path))
}


function containsBlockedCommand(command : string){
    const tokens = command.split(/\s+|&&|\|\||;|\|/);
    console.log("Tokens:")
    console.log(tokens)
    const bloked = tokens.some(token => BLOCKED_COMMANDS.has(token))

    console.log(`Blocked command found: ${bloked}`)
    return bloked
}

function checkPathSafety(filePath: string) {
    const resolved = path.resolve(WORKING_DIR, filePath)
    if (!resolved.startsWith(WORKING_DIR)) {
        throw new Error(`Unsafe file path: ${filePath}`)
    }
    return resolved
}

function runReadFile(filePath: string, limit?: number) {
    try {
        const safeFilePath = validatePath(filePath)
        const fileData = fs.readFileSync(safeFilePath, "utf8")
        const lines = fileData.split("\n")

        // Do not exceed 50k chars to be passed into the LLM
        return (limit ? lines.slice(0, limit) : lines).join("\n").slice(0, 50000)
    } catch (error) {
        return `Error : ${error}`
    }
}

function runBuildCommand(){
    try {
        const result = spawnSync("sh", ["-c", "npm run build"], {
            cwd: WORKING_DIR,
            encoding: "utf8",  
        })
        console.log("Result from the Build command =========")
        console.log(result)
        return (result.stdout + result.stderr).trim().slice(0, 50000) || ""
    } catch (error) {
        return `Error building the project : ${error}`
    }
}

function runBash(command: string): string {
    if(containsBlockedCommand(command)){
        return `Command is blocked`
    }
    if(referencesBlockedPath(command)){
        console.log(`Command references blocked path: ${command}`)
        return `Access to protected direcories is blocked`
    }
    try {
        const result = spawnSync("sh", ["-c", command], {
            cwd: process.cwd(),
            encoding: "utf8",
            timeout: 120000
        })
        console.log(result)
        return (result.stdout + result.stderr).trim().slice(0, 50000) || ""
    } catch (error) {
        console.error(`error : ${error}`)
        return 'Error running bash command'
    }
}

function runWriteFile(filepath: string, content: string) {
    try {
        // check if the dir exists
        const dirPath = path.dirname(filepath)
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
        }
        const safeFilePath = validatePath(filepath)
        fs.writeFileSync(safeFilePath, content)
        return `Wrote the file : ${filepath}`

    } catch (error) {
        return `Error : ${error}`
    }
}

function runEditFile(filepath: string, oldContent: string, newContent: string) {
    try {
        const safeFilePath = validatePath(filepath)
        const content = fs.readFileSync(safeFilePath, "utf8").trim()
        if (!content.includes(oldContent.trim())) {
            return `Error : ${oldContent} not found in ${filepath}`
        }
        fs.writeFileSync(safeFilePath, content.replaceAll(oldContent, newContent))
        return `Successfully Edited the file : ${filepath}`
    } catch (error) {
        return `Error : ${error}`
    }
}

function getSubagentMessages(prompt: string) {
    const messagesForSubagent: ModelMessage[] = [{
        role: "assistant",
        content: `You are subagent, with a given instruction (TASK). Your task is to use tools, if needed, to perfrom the task. And return a summary of what u did, and along with the summary of the output`
    }, {
        role: 'user',
        content: prompt
    }]
    return messagesForSubagent
}

async function runSubagent(prompt: string) : Promise<string> {
    try {
        const { text } = await generateText({
            model: model,
            stopWhen: isLoopFinished(),
            system: getSubagentSystemPrompt(),
            messages: getSubagentMessages(prompt),
            tools: TOOLS
        })

        return text
    } catch (error) {
        return `Error occurred : ${error}`
    }
}

export {
    runReadFile,
    runBash,
    runWriteFile,
    runEditFile,
    runSubagent,
    runBuildCommand,
    validatePath
}
