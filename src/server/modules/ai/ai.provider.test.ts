import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "@/server/shared/errors";

async function withEnv<T>(env: Record<string, string | undefined>, run: () => Promise<T> | T) {
  const previous = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
    AI_BASE_URL: process.env.AI_BASE_URL
  };

  if (env.AI_PROVIDER === undefined) {
    delete process.env.AI_PROVIDER;
  } else {
    process.env.AI_PROVIDER = env.AI_PROVIDER;
  }

  if (env.AI_API_KEY === undefined) {
    delete process.env.AI_API_KEY;
  } else {
    process.env.AI_API_KEY = env.AI_API_KEY;
  }

  if (env.AI_MODEL === undefined) {
    delete process.env.AI_MODEL;
  } else {
    process.env.AI_MODEL = env.AI_MODEL;
  }

  if (env.AI_BASE_URL === undefined) {
    delete process.env.AI_BASE_URL;
  } else {
    process.env.AI_BASE_URL = env.AI_BASE_URL;
  }

  try {
    return await run();
  } finally {
    if (previous.AI_PROVIDER === undefined) {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = previous.AI_PROVIDER;
    }

    if (previous.AI_API_KEY === undefined) {
      delete process.env.AI_API_KEY;
    } else {
      process.env.AI_API_KEY = previous.AI_API_KEY;
    }

    if (previous.AI_MODEL === undefined) {
      delete process.env.AI_MODEL;
    } else {
      process.env.AI_MODEL = previous.AI_MODEL;
    }

    if (previous.AI_BASE_URL === undefined) {
      delete process.env.AI_BASE_URL;
    } else {
      process.env.AI_BASE_URL = previous.AI_BASE_URL;
    }
  }
}

test("selects DeepSeek provider configuration", async () => {
  const { __internal } = await import("@/server/modules/ai/ai.provider");

  const config = await withEnv(
    {
      AI_PROVIDER: "deepseek",
      AI_API_KEY: "secret",
      AI_MODEL: "deepseek-v4-flash",
      AI_BASE_URL: "https://api.deepseek.com"
    },
    async () => __internal.resolveProviderConfig()
  );

  assert.equal(config.provider, "deepseek");
  assert.equal(config.endpoint, "https://api.deepseek.com/chat/completions");
});

test("selects OpenAI provider configuration", async () => {
  const { __internal } = await import("@/server/modules/ai/ai.provider");

  const config = await withEnv(
    {
      AI_PROVIDER: "openai",
      AI_API_KEY: "secret",
      AI_MODEL: "gpt-5.4",
      AI_BASE_URL: "https://api.openai.com"
    },
    async () => __internal.resolveProviderConfig()
  );

  assert.equal(config.provider, "openai");
  assert.equal(config.endpoint, "https://api.openai.com/v1/responses");
  assert.equal(config.headers.Authorization, "Bearer secret");
});

test("selects Azure provider configuration", async () => {
  const { __internal } = await import("@/server/modules/ai/ai.provider");

  const config = await withEnv(
    {
      AI_PROVIDER: "azure",
      AI_API_KEY: "secret",
      AI_MODEL: "gpt-5.4",
      AI_BASE_URL: "https://example-resource.openai.azure.com/openai/v1/"
    },
    async () => __internal.resolveProviderConfig()
  );

  assert.equal(config.provider, "azure");
  assert.equal(config.endpoint, "https://example-resource.openai.azure.com/openai/v1/responses");
  assert.equal(config.headers["api-key"], "secret");
});

test("throws for invalid provider configuration", async () => {
  const { __internal } = await import("@/server/modules/ai/ai.provider");

  await assert.rejects(
    async () =>
      withEnv(
        {
          AI_PROVIDER: "invalid",
          AI_API_KEY: "secret",
          AI_MODEL: "model",
          AI_BASE_URL: "https://example.com"
        },
        async () => __internal.resolveProviderConfig()
      ),
    (error: unknown) => error instanceof Error
  );
});

test("throws for missing API key", async () => {
  const { generateStructuredJson } = await import("@/server/modules/ai/ai.provider");

  await assert.rejects(
    async () =>
      withEnv(
        {
          AI_PROVIDER: "deepseek",
          AI_API_KEY: undefined,
          AI_MODEL: "deepseek-v4-flash",
          AI_BASE_URL: "https://api.deepseek.com"
        },
        async () =>
          generateStructuredJson({
            system: "s",
            user: "u",
            jsonSchema: { type: "object" }
          })
      ),
    (error: unknown) => error instanceof AppError && error.code === "AI_NOT_CONFIGURED"
  );
});

test("throws for invalid model configuration", async () => {
  const { __internal } = await import("@/server/modules/ai/ai.provider");

  await assert.rejects(
    async () =>
      withEnv(
        {
          AI_PROVIDER: "openai",
          AI_API_KEY: "secret",
          AI_MODEL: "   ",
          AI_BASE_URL: "https://api.openai.com"
        },
        async () => __internal.resolveProviderConfig()
      ),
    (error: unknown) => error instanceof AppError && error.code === "AI_MODEL_INVALID"
  );
});

test("detects malformed provider response payload", async () => {
  const { __internal } = await import("@/server/modules/ai/ai.provider");

  assert.throws(
    () => __internal.extractDeepSeekOutput({ choices: [] }),
    (error: unknown) => error instanceof AppError && error.code === "AI_INVALID_RESPONSE"
  );

  assert.throws(
    () => __internal.extractOpenAiOutput({ output_text: "" }),
    (error: unknown) => error instanceof AppError && error.code === "AI_INVALID_RESPONSE"
  );
});
