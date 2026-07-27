import { spawnSync } from "child_process"
import * as fs from "node:fs"
import path from "node:path"
import { generateText, isLoopFinished, type ModelMessage } from "ai"
import { TOOLS } from "./tools.js"
import { model, WORKING_DIR } from "./model.js"
import { getSubagentSystemPrompt } from "./prompt.js"

const BLOCKED_COMMANDS = ["sudo", "rm -rf /", "shutdown", "reboot"]

function checkPathSafety(filePath: string) {
    const resolved = path.resolve(WORKING_DIR, filePath)
    if (!resolved.startsWith(WORKING_DIR)) {
        throw new Error(`Unsafe file path: ${filePath}`)
    }
    return resolved
}

function runReadFile(filePath: string, limit?: number) {
    try {
        const safeFilePath = checkPathSafety(filePath)
        const fileData = fs.readFileSync(safeFilePath, "utf8")
        const lines = fileData.split("\n")

        // Do not exceed 50k chars to be passed into the LLM
        return (limit ? lines.slice(0, limit) : lines).join("\n").slice(0, 50000)
    } catch (error) {
        return `Error : ${error}`
    }
}

function runBash(command: string): string {
    if (BLOCKED_COMMANDS.some((cmd) => command.startsWith(cmd))) {
        console.error("Command is blocked")
        return "Command is blocked"
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
        const safeFilePath = checkPathSafety(filepath)
        fs.writeFileSync(safeFilePath, content)
        return `Wrote the file : ${filepath}`

    } catch (error) {
        return `Error : ${error}`
    }
}

function runEditFile(filepath: string, oldContent: string, newContent: string) {
    try {
        const safeFilePath = checkPathSafety(filepath)
        const content = fs.readFileSync(safeFilePath, "utf8")
        if (!content.includes(oldContent)) {
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
        role: "system",
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
    runSubagent
}
