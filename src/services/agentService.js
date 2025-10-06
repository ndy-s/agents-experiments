import OpenAI from "openai";
import { config } from "../config/env.js";

const client = new OpenAI({ apiKey: config.openAiApiKey });

export async function handleAgentMessage(userMessage) {
    try {
        const response = await client.responses.create({
            model: "gpt-3.5-turbo",
            input: [
                {
                    role: "system",
                    content: `
                        You are an assistant for a WhatsApp bot.
                        Analyze the user message.
                    `,
                },
                { role: "user", content: userMessage },
            ],
            // text: { format: { type: "json_object" } },
        });
        console.log(response);
        return "SUCCESS";
    } catch (e) {
        console.error("OpenAI API error:", e);
        return "There was an error contacting the assistant.";
    }
}


