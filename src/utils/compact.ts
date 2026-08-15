import { generateText, type ModelMessage } from "ai";
import { model } from "./model.js";

const CHARS_PER_TOKEN: number = 4
const TOOL_PRESET = 3
const MESSAGES_PRESET = 3
export const CONTEXT_LIMIT = 1500
function estimateTokens(messages: ModelMessage[]) {
    return JSON.stringify(messages).length / CHARS_PER_TOKEN
}


// this function runs on every agent loop invocation
function microCompaction(messages: ModelMessage[]): ModelMessage[] {
    // removes all the tool calls/results excepts read_file tool

    const updatedMessages = messages.filter((msg) => msg.role === "tool" && Array.isArray(msg.content) && msg.content.some((part) => "toolName" in part && part.toolName === "read_file"))

    console.log("+=".repeat(30))

    const recentToolCalls = updatedMessages.slice(-TOOL_PRESET)
    messages = [...recentToolCalls, ...messages.slice(-MESSAGES_PRESET)]
    return messages
    // console.log(JSON.stringify(messages))
}


// this function runs when the context size crosses CONTEXT_LIMIT
async function autoCompaction(messages: ModelMessage[]) {

    const messagesToCompact = messages.slice(0, -MESSAGES_PRESET)
    const messagesToKeep = messages.slice(-MESSAGES_PRESET)

    const { text } = await generateText({
        model: model,
        system: "You have been assigned a task to summarize the given conversation under 1000 tokens (approx 4000 chars). Maintain the flow, majow steps taken and concise the read_file tool output if present.",
        messages: messagesToCompact,
    })

    return [{
        role : "assistant",
        content : `Compacted summary of the conversation : ${text ? text : ""}`
    }, ...messagesToKeep]
}


async function runCompaction(messages : ModelMessage[]){

}


export {
    estimateTokens,
    microCompaction,
    autoCompaction,
    runCompaction,
    CHARS_PER_TOKEN,

}