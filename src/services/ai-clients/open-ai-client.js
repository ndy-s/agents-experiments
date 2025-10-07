import OpenAI from "openai";
import { BaseAI } from "./base-ai.js";
import { config } from "../../config/env.js";
import { getApiPrompt } from "../../config/prompt.js";

export class OpenAIClient extends BaseAI {
    constructor() {
        super();
        this.client = new OpenAI({ apiKey: config.apiKeys.openAI });
        this.model = "gpt-4o-mini"; 
    }

    async callModel(contents, options = {}) {
        const { responseSchema } = options;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const messages = [
                    {
                        role: "user",
                        content: contents
                    }
                ];

                const requestParams = {
                    model: this.model,
                    messages: messages,
                };

                if (responseSchema) {
                    requestParams.response_format = {
                        type: "json_schema",
                        json_schema: {
                            name: "api_response_schema",
                            schema: responseSchema,
                        },
                    };
                }

                const response = await this.client.chat.completions.create(requestParams);

                return response.choices[0].message.content;
            } catch (e) {
                if (e.status === 429) {
                    console.error("🚫 OpenAI quota exceeded or too many requests.");
                    throw new Error("API limit reached. Please check your OpenAI quota or try again later.");
                }

                if (e.status === 401 || e.status === 403) {
                    console.error("🔑 Invalid or unauthorized OpenAI API key:", e);
                    throw new Error("Invalid or unauthorized OpenAI API key. Please update your credentials.");
                }

                if (e.status === 503) {
                    console.warn(`⚠️ OpenAI overloaded (attempt ${attempt}/3). Retrying in ${attempt}s...`);
                    await new Promise((r) => setTimeout(r, 1000 * attempt));
                    continue;
                }

                console.error("❌ Unexpected OpenAI error:", e);
                throw e;
            }
        }

        throw new Error("OpenAI API unavailable after multiple retries.");
    }

    async processUserInput(userMessage) {
        const prompt = getApiPrompt(userMessage);

        const schema = {
            type: "object",
            additionalProperties: false,
            properties: {
                action: {
                    type: "string",
                    enum: ["response", "api_call"],
                    description: "Determines whether to send a normal response or trigger an API call.",
                },
                inScope: {
                    type: "boolean",
                    description: "True if the user's input is within the supported API scope, false otherwise.",
                },
                apiCalls: {
                    type: "array",
                    items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            api: {
                                type: "string",
                                enum: ["LNO8888C.SVC", "LNO8888D.SVC"],
                            },
                            params: {
                                type: "object",
                                additionalProperties: false,
                                properties: {
                                    pgmType: { type: "string" },
                                    refNo: { type: "string" },
                                    prdCode: { type: "string" },
                                    custNo: { type: "string" },
                                    lonTerm: { type: "string" },
                                    repayPlan: { type: "string" },
                                    limitAmt: { type: "string" },
                                    riskSeg: { type: "string" },
                                    grade: { type: "string" },
                                    groupCd: { type: "string" },
                                    excludeStep: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                            enum: ["SAVE", "CONT", "VERI"],
                                        },
                                    },
                                },
                                required: [],
                            },
                        },
                        required: ["api", "params"],
                    },
                },
                text: {
                    type: "string",
                    description: "Free-form response text if 'action' is 'response'.",
                },
            },
            required: ["action", "inScope"],
        };

        try {
            const jsonText = await this.callModel(prompt, { responseSchema: schema });
            return JSON.parse(jsonText);
        } catch (e) {
            console.warn("Failed to process user request:", e);
            return {
                action: "response",
                inScope: false,
                text: "Oops, something went wrong while processing your request.",
            };
        }
    }
}

