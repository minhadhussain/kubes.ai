import { getAiEnv } from "@/lib/env";
import { AppError } from "@/server/shared/errors";

type JsonSchemaPrompt = {
  system: string;
  user: string;
  jsonSchema: Record<string, unknown>;
};

type AiProviderResponse = {
  outputText: string;
  provider: string;
  model: string;
  baseUrl: string;
};

type ResolvedProviderConfig = {
  provider: "openai" | "deepseek";
  apiKey: string;
  model: string;
  baseUrl: string;
  endpoint: string;
};

function resolveProviderConfig(): ResolvedProviderConfig {
  const env = getAiEnv();

  if (!env?.AI_PROVIDER || !env.AI_API_KEY || !env.AI_MODEL || !env.AI_BASE_URL) {
    throw new AppError(
      "AI is not configured. Set AI_PROVIDER, AI_API_KEY, AI_MODEL, and AI_BASE_URL on the server before using AI features.",
      503,
      "AI_NOT_CONFIGURED"
    );
  }

  if (!env.AI_MODEL.trim()) {
    throw new AppError("AI model configuration is invalid.", 500, "AI_MODEL_INVALID");
  }

  if (env.AI_PROVIDER === "openai") {
    return {
      provider: env.AI_PROVIDER,
      apiKey: env.AI_API_KEY,
      model: env.AI_MODEL,
      baseUrl: env.AI_BASE_URL,
      endpoint: `${env.AI_BASE_URL.replace(/\/$/, "")}/v1/responses`
    };
  }

  if (env.AI_PROVIDER === "deepseek") {
    return {
      provider: env.AI_PROVIDER,
      apiKey: env.AI_API_KEY,
      model: env.AI_MODEL,
      baseUrl: env.AI_BASE_URL,
      endpoint: `${env.AI_BASE_URL.replace(/\/$/, "")}/chat/completions`
    };
  }

  throw new AppError("Unsupported AI provider configured.", 500, "AI_PROVIDER_UNSUPPORTED");
}

function extractOpenAiOutput(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("output_text" in payload)) {
    throw new AppError("AI provider returned an invalid response payload.", 502, "AI_INVALID_RESPONSE");
  }

  const outputText = (payload as { output_text?: unknown }).output_text;

  if (typeof outputText !== "string" || outputText.trim().length === 0) {
    throw new AppError("AI provider returned an empty response.", 502, "AI_INVALID_RESPONSE");
  }

  return outputText;
}

function extractDeepSeekOutput(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("choices" in payload)) {
    throw new AppError("AI provider returned an invalid response payload.", 502, "AI_INVALID_RESPONSE");
  }

  const choices = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
  const content = choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new AppError("AI provider returned an empty response.", 502, "AI_INVALID_RESPONSE");
  }

  return content;
}

export async function generateStructuredJson(prompt: JsonSchemaPrompt): Promise<AiProviderResponse> {
  const config = resolveProviderConfig();

  const body =
    config.provider === "openai"
      ? {
          model: config.model,
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: prompt.system }]
            },
            {
              role: "user",
              content: [{ type: "input_text", text: prompt.user }]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: "structured_output",
              schema: prompt.jsonSchema,
              strict: true
            }
          }
        }
      : {
          model: config.model,
          messages: [
            {
              role: "system",
              content: `${prompt.system}\nReturn valid JSON only that matches this JSON Schema: ${JSON.stringify(prompt.jsonSchema)}`
            },
            {
              role: "user",
              content: prompt.user
            }
          ],
          response_format: {
            type: "json_object"
          }
        };

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(`AI provider error: ${body}`, 502, "AI_PROVIDER_ERROR");
  }

  const payload = await response.json();

  const outputText = config.provider === "openai" ? extractOpenAiOutput(payload) : extractDeepSeekOutput(payload);

  return {
    outputText,
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl
  };
}

export const __internal = {
  resolveProviderConfig,
  extractOpenAiOutput,
  extractDeepSeekOutput
};
