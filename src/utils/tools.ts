import { tool, zodSchema } from "ai"
import { runBash, runEditFile, runReadFile, runSubagent, runWriteFile } from "./command.js"
import { z } from "zod"

// TOOLS
 const TOOLS = {
    bash: tool({
        description: "Run a shell command",
        inputSchema: zodSchema(z.object({ command: z.string() })),
        execute: (async ({ command }: { command: string }) => {
            const output = runBash(command)
            return output
        })
    }),
    read_file: tool({
        description: "Read a file with given filepath",
        inputSchema: zodSchema(z.object({ filepath: z.string().describe("path of the file to be read"), limit: z.number().optional().describe("limit to read number of lines") })),
        execute: (async ({ filepath, limit }) => runReadFile(filepath, limit))
    }),
    write_file: tool({
        description: "Write content to a file",
        inputSchema: zodSchema(z.object({ filepath: z.string(), content: z.string() })),
        execute: ({ filepath, content }) => runWriteFile(filepath, content)
    }),
    edit_file: tool({
        description: "Edit the content of an existing file with the new content",
        inputSchema: zodSchema(z.object({ filepath: z.string(), oldContent: z.string(), newContent: z.string() })),
        execute: ({ filepath, oldContent, newContent }) => runEditFile(filepath, oldContent, newContent)
    })
}

const PARENT_TOOLS = {
    ...TOOLS,
    subAgent: tool({
        description: "This will spawn a subagent with arrowed single task to perform",
        inputSchema: zodSchema(z.object({ prompt: z.string().describe("Prompt/Instruction for the subagent to perform") })),
        execute: ({ prompt }) => runSubagent(prompt)
    })
}

export {
    TOOLS, 
    PARENT_TOOLS
}