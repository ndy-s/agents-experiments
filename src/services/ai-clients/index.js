import { OpenAIClient } from "./open-ai-client.js";
import { GoogleAIClient } from "./google-ai-client.js";

export function getAIClient(provider = "googleai") {
    switch (provider) {
        case "openai":
            return new OpenAIClient();
        case "googleai":
            return new GoogleAIClient();
        default:
            throw new Error("Unknown AI provider");
    }
}


