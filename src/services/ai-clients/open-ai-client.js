import OpenAI from "openai";
import { config } from "../../config/env.js";
import { BaseAI } from "./base-ai.js";
import {getApiPrompt} from "../../config/prompt.js";

export class OpenAIClient extends BaseAI {
    constructor() {
        super();
        this.client = new OpenAI({ apiKey: config.apiKeys.openAI });
        this.model = "gpt-4o-mini";
    }

    async callModel(prompt) {
        try {
            const response = await this.client.responses.create({
                model: this.model,
                input: [
                    { role: "system", content: prompt },
                ],
                temperature: 0,
            });

            return response.output_text || "";
        } catch (e) {
            console.error("OpenAI API error:", e);
            throw e;
        }
    }

    async processUserInput(userMessage) {
        const prompt = getApiPrompt(userMessage);

        try {
            const rawOutput = await this.callModel(prompt);
            return JSON.parse(rawOutput);
        } catch (e) {
            console.warn("Failed to process request:", e);
            return {
                action: "response",
                inScope: false,
                text: "Ups, sepertinya ada masalah"
            };
        }
    }
}
