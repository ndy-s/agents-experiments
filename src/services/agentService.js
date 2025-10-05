import OpenAI from "openai";
import { z } from "zod";
import { config } from "../config/env.js";

const client = new OpenAI({ apiKey: config.openAiApiKey });


export async function handleAgentMessage(userMessage) {
  try {
    const response = await client.responses.create({
      model: "gpt-4-turbo",
      input: [
        {
          role: "system",
          content: `
You are an assistant for a WhatsApp bot.
Analyze the user message and decide:
- "call_api" → if the user wants to fetch or send data.
- "generate_report" → if the user requests a report.
- "chat" → if it’s a normal conversation.
Always respond in JSON format with keys: action, reply.
If you are unsure which action to take, use "chat".
Never make up actions.
          `,
        },
        { role: "user", content: userMessage },
      ],
        text: { format: { type: "json_object" } },
    });

        
        let parsed;
    if (response.status === "completed") {

      console.log(JSON.parse(response.output_text))
            parsed = response.output_text;
    }

    // Guardrail: if action is missing or invalid, default to "chat"
    const safeAction = ["call_api", "generate_report", "chat"].includes(parsed.action)
      ? parsed.action
      : "chat";

    // Handle actions
    switch (safeAction) {
      case "call_api":
        return "API"; // implement callApi logic with parsed.params if needed
      case "generate_report":
        return "REPORT"; // implement generateReport logic with parsed.params if needed
      case "chat":
      default:
        return parsed.reply || "🤖 I'm not sure what you mean.";
    }
  } catch (e) {
    console.error("OpenAI API error:", e);
    return "🤖 There was an error contacting the assistant.";
  }
}


