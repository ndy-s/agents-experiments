import { BaseAI } from "./base-ai.js";
import { config } from "../../config/env.js";
import { GoogleGenAI, Type } from "@google/genai";
import { getApiPrompt } from "../../config/prompt.js";

export class GoogleAIClient extends BaseAI {
    constructor() {
        super();
        this.client = new GoogleGenAI({ apiKey: config.apiKeys.googleAI });
        this.model = "gemini-2.5-flash";
    }

    async callModel(contents, options = {}) {
        const { responseMimeType = "text/plain", responseSchema } = options;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await this.client.models.generateContent({
                    model: this.model,
                    contents,
                    config: {
                        responseMimeType,
                        responseSchema,
                    },
                });

                return response.text;
            } catch (e) {
                if (e.status === 429) {
                    console.error("🚫 GoogleAI quota exceeded or too many requests.");
                    throw new Error("API limit reached. Please check your Google AI quota or try again later.");
                }

                if (e.status === 401 || e.status === 403) {
                    console.error("🔑 Invalid or unauthorized GoogleAI API key:", e);
                    throw new Error("Invalid or unauthorized Google AI API key. Please update your credentials.");
                }

                if (e.status === 503) {
                    console.warn(`⚠️ Gemini overloaded (attempt ${attempt}/3). Retrying in ${attempt}s...`);
                    await new Promise((r) => setTimeout(r, 1000 * attempt));
                    continue;
                }

                console.error("❌ Unexpected GoogleAI error:", e);
                throw e;
            }
        }

        throw new Error("Gemini API unavailable after multiple retries.");
    }

    async processUserInput(userMessage) {
        const prompt = getApiPrompt(userMessage);

        const schema = {
            type: Type.OBJECT,
            properties: {
                action: {
                    type: Type.STRING,
                    enum: ["response", "api_call"],
                    description: "Determines whether to send a normal response or trigger an API call.",
                },
                inScope: {
                    type: Type.BOOLEAN,
                    description: "True if the user's input is within the supported API scope, false otherwise.",
                },
                api: {
                    type: Type.STRING,
                    enum: ["LNO8888C.SVC", "LNO8888D.SVC"],
                    nullable: true,
                    description: "The target API name to call, if applicable.",
                },
                params: {
                    type: Type.OBJECT,
                    properties: {
                        pgmType: { type: Type.STRING, nullable: true },
                        refNo: { type: Type.STRING, nullable: true },
                        prdCode: { type: Type.STRING, nullable: true },
                        custNo: { type: Type.STRING, nullable: true },
                        lonTerm: { type: Type.STRING, nullable: true },
                        repayPlan: { type: Type.STRING, nullable: true },
                        limitAmt: { type: Type.STRING, nullable: true },
                        riskSeg: { type: Type.STRING, nullable: true },
                        grade: { type: Type.STRING, nullable: true },
                        groupCd: { type: Type.STRING, nullable: true },
                        excludeStep: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                enum: ["SAVE", "CONT", "VERI"],
                            },
                            nullable: true,
                            description: "List of process steps to exclude during API execution.",
                        },
                    },
                    required: [],
                    nullable: true,
                },
                text: {
                    type: Type.STRING,
                    nullable: true,
                    description: "Free-form response text if 'action' is 'response'.",
                },
            },
            required: ["action", "inScope"],
        };

        try {
            const jsonText = await this.callModel(prompt, {
                responseMimeType: "application/json",
                responseSchema: schema,
            });

            return JSON.parse(jsonText);
        } catch (e) {
            console.warn("Failed to process user request:", e);
            return {
                action: "response",
                text: "Oops, something went wrong while processing your request.",
            };
        }
    }
}


