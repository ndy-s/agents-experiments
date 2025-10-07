import "dotenv/config";

const required = [
    "BASE_API_URL",
    "OPENAI_API_KEY", 
    "GOOGLEAI_API_KEY"
];

for (const key of required) {
    if (!process.env[key]) {
        console.error(`❌ Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

export const config = {
    baseApiUrl: process.env.BASE_API_URL,
    apiKeys: {
        openAI: process.env.OPENAI_API_KEY,
        googleAI: process.env.GOOGLEAI_API_KEY,
    },
    whitelist: process.env.WHITELIST ? process.env.WHITELIST.split(",").map((id) => id.trim()) : [],
    errorRecipientJid: process.env.ERROR_RECIPIENT_JID,
    aiLanguage: process.env.AI_LANGUAGE,
};


