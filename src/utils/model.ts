import { openai } from "@ai-sdk/openai";

export const model = openai("gpt-4o")

export const WORKING_DIR = process.cwd()
