import { tool, zodSchema } from "ai"
import { runBash, runBuildCommand, runEditFile, runReadFile, runSubagent, runWriteFile } from "./command.js"
import { z } from "zod"
import { editTask, readTask, writeTask } from "../task/taskUtils.js"
import { title } from "node:process"

type TodoStatus = "pending" | "in_progress" | "completed" | "failed"

interface TodoItem {
    id: string
    title: string
    description: string
    status: TodoStatus
}

const TODOS: TodoItem[] = []

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
        execute: (async ({ filepath, limit }) => { return runReadFile(filepath, limit) })
    }),
    write_file: tool({
        description: "Write content to a file",
        inputSchema: zodSchema(z.object({ filepath: z.string(), content: z.string() })),
        execute: (async ({ filepath, content }) => { return runWriteFile(filepath, content) })
    }),
    edit_file: tool({
        description: "Edit the content of an existing file with the new content",
        inputSchema: zodSchema(z.object({ filepath: z.string(), oldContent: z.string(), newContent: z.string() })),
        execute: (async ({ filepath, oldContent, newContent }) => { return runEditFile(filepath, oldContent, newContent) })
    }),
    build_project: tool({
        description: "Build the project with given build command to check for errors",
        inputSchema: zodSchema(z.object({})),
        execute: (async () => {
            const result = runBuildCommand()
            return result
        })
    }),
    update_todos: tool({
        // this would be a short checklist 
        description: "Create or update the todo list for multi-step complex task",
        inputSchema: zodSchema(z.object({
            todos: z.array(z.object({
                id: z.string(),
                title: z.string().describe("Title of the todo"),
                description: z.string().describe("Comprehensive description about the todo"),
                status: z.enum(["pending", "in_progress", "completed", "failed"])
            }))
        })),
        execute: async ({ todos }) => {
            TODOS.splice(0, TODOS.length, ...todos)
            console.log(TODOS)

            return {
                success: true,
                todos: TODOS
            }
        }
    }),
    
}

// Only the parent agent should have access to task management  tools
const PARENT_TOOLS = {
    ...TOOLS,
    subAgent: tool({
        description: `Delegate one bounded, independently executable objective to a subagent.

                    Use this when the parent agent only needs the result and does not need
                    to supervise the subagent's internal work.

                    The subagent should receive:
                    - one clear objective
                    - scope boundaries
                    - whether modifications are allowed
                    - expected output

                    The subagent returns a concise result to the parent.
                    The parent remains responsible for planning, task/todo state,
                    integration, and final verification.
                `,
        inputSchema: zodSchema(z.object({ prompt: z.string().describe("A single bounded objective with explicit scope and expected output") })),
        execute: (async ({ prompt }) => { return runSubagent(prompt) })
    }),
    write_task: tool({
        description: "Write the tasks to the .tasks/task.json file",
        inputSchema: zodSchema(z.object({
            tasks: z.array(z.object({
                taskid : z.string().uuid({version : "v4"}).describe("Unique identifier for the task"),
                title: z.string(),
                description: z.string(),
                status: z.enum(["pending", "in_progress", "completed", "failed"])
            }))
        })),
        execute: async ({ tasks }) => {
            writeTask(tasks)
            return {
                success: true,
                message: "Tasks written successfully"
            }
        }
    }),
    read_task : tool({
        description : "Read the tasks from the .tasks/task.json file",
        inputSchema : zodSchema(z.object({})),
        execute : async () => {
            return readTask()
        }

    }),
    edit_task : tool({
        description : "Edit a particular task with a given taskid",
        inputSchema : z.object({
            taskid : z.string().uuid({version : "v4"}).describe("Unique identifier for the task to be edited"),
            task : z.object({
                title : z.string().describe("Updated title for the task"),
                description : z.string().describe("Updated description for the task"),
                status : z.enum(["pending" ,  "completed" , "failed" , "in_progress"]).describe("Updated status for the task as per the task done status")
            })
        }),
        execute : async ({task, taskid}) => {
            return editTask(taskid, {...task, taskid : taskid})
        }
    })
}

export {
    TOOLS,
    PARENT_TOOLS
}