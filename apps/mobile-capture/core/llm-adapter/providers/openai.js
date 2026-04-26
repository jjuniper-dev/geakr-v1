import OpenAI from 'openai';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export function getOpenAIProvider() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required');
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return {
    name: 'openai',
    model: OPENAI_MODEL,

    async structuredExtract({ schema, messages, temperature = 0.1 }) {
      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        temperature,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'extraction_result',
            strict: true,
            schema
          }
        }
      });

      return JSON.parse(completion.choices[0].message.content);
    }
  };
}
