import { BaseAI } from "./base-ai.js";
import { config } from "../../config/env.js";
import { GoogleGenAI, Type } from "@google/genai";
import {getApiPrompt} from "../../config/prompt.js";

export class GoogleAIClient extends BaseAI {
    constructor() {
        super();
        this.client = new GoogleGenAI({ apiKey: config.apiKeys.googleAI });
        this.model = "gemini-2.5-flash"
    }

    async callModel(contents, options = {}) {
        const { responseMimeType = "text/plain", responseSchema } = options;

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
            console.error("GoogleAI API error:", e);
            throw e;
        }
    }

    async processUserInput(userMessage) {
        const prompt = getApiPrompt(userMessage);

        const schema = {
            type: Type.OBJECT,
            properties: {
                action: {
                    type: Type.STRING,
                    enum: ["response", "api_call"],
                },
                inScope: {
                    type: Type.BOOLEAN,
                    description: "Benar jika input pengguna termasuk dalam lingkup API, salah jika di luar lingkup",
                },
                api: {
                    type: Type.STRING,
                    enum: ["LNO8888C.SVC", "LNO8888D.SVC"],
                    nullable: true
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
                                enum: ["SAVE", "CONT", "VERI"]
                            },
                            nullable: true,
                        },
                    },
                    required: [],
                    nullable: true,
                },
                text: { type: Type.STRING, nullable: true },
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
            console.warn("Failed to process request:", e);
            return {
                action: "response",
                inScope: false,
                text: "Ups, sepertinya ada masalah"
            };
        }
    }
}
