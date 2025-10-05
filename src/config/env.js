import "dotenv/config";

const required = ["OPENAI_API_KEY"];

for (const key of required) {
    if (!process.env[key]) {
        console.error(`❌ Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

export const config = {
    openAiApiKey: process.env.OPENAI_API_KEY,
    whitelist: process.env.WHITELIST ? process.env.WHITELIST.split(",").map((id) => id.trim()) : [],
};


