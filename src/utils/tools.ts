import { tool, zodSchema } from "ai"
import { runBash, runBuildCommand, runEditFile, runReadFile, runSubagent, runWriteFile } from "./command.js"
import { z } from "zod"

type TodoStatus = "pending" | "in_progress" | "completed" | "failed"

interface TodoItem {
    id : string
    title : string
    description : string
    status : TodoStatus
}

const TODOS : TodoItem[]= []

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
        execute: (async ({ filepath, limit }) => {return runReadFile(filepath, limit)})
    }),
    write_file: tool({
        description: "Write content to a file",
        inputSchema: zodSchema(z.object({ filepath: z.string(), content: z.string() })),
        execute: (async ({ filepath, content }) => {return runWriteFile(filepath, content)})
    }),
    edit_file: tool({
        description: "Edit the content of an existing file with the new content",
        inputSchema: zodSchema(z.object({ filepath: z.string(), oldContent: z.string(), newContent: z.string() })),
        execute: (async ({ filepath, oldContent, newContent }) => {return runEditFile(filepath, oldContent, newContent)})
    }),
    build_project : tool({
        description : "Build the project with given build command to check for errors",
        inputSchema : zodSchema(z.object({})),
        execute : (async ()=>{
            const result = runBuildCommand()
            return result
        })
    }),
    update_todos : tool({
        description : "Create or update the todo list for multi-step complex task",
        inputSchema : zodSchema(z.object({
            todos : z.array(z.object({
                id : z.string(),
                title : z.string().describe("Title of the todo"),
                description : z.string().describe("Comprehensive description about the todo"),
                status : z.enum(["pending", "in_progress", "completed", "failed"])
            }))
        })),
        execute : async ({todos})=>{
            TODOS.splice(0, TODOS.length, ...todos)
            console.log(TODOS)

            return {
                success : true,
                todos : TODOS
            }
        }
    }) 
}

const PARENT_TOOLS = {
    ...TOOLS,
    subAgent: tool({
        description: "This will spawn a subagent with arrowed single task to perform",
        inputSchema: zodSchema(z.object({ prompt: z.string().describe("Prompt/Instruction for the subagent to perform") })),
        execute: (async ({ prompt }) => {return runSubagent(prompt)})
    })
}

export {
    TOOLS, 
    PARENT_TOOLS
}