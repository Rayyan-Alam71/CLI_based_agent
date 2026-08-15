import * as fs from "node:fs"
import * as path from "node:path"
import * as os from "node:os"

export const CONFIG_DIR = path.join(os.homedir(), ".terminal-agent")
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json")

export function loadStoredKey(): string | undefined {
    if (!fs.existsSync(CONFIG_PATH)) return undefined
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
        return config.OPENAI_API_KEY
    } catch {
        return undefined
    }
}

export function saveKey(key: string): void {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true })
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ OPENAI_API_KEY: key }, null, 2), {
        mode: 0o600,
    })
}

export async function ensureApiKey(): Promise<void> {
    if (process.env.OPENAI_API_KEY) return

    const stored = loadStoredKey()
    if (stored) {
        process.env.OPENAI_API_KEY = stored
        return
    }

    console.log("No OpenAI API key found. Run the agent and use /setkey to set one, or set OPENAI_API_KEY as an env var.")
    process.exit(1)
}