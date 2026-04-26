import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = 'claude-opus';

export function getClaudeProvider() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required for Claude provider');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;

  return {
    name: 'claude',
    model,

    async structuredExtract({ schema, messages, temperature = 0.1 }) {
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');

      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: systemMessage?.content || '',
        tools: [
          {
            name: 'extract_structured_data',
            description: 'Extract and return structured data matching the provided schema',
            input_schema: schema
          }
        ],
        messages: userMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      });

      const toolUse = response.content.find(block => block.type === 'tool_use');
      if (!toolUse || toolUse.type !== 'tool_use') {
        throw new Error('Claude did not return structured extraction');
      }

      return toolUse.input;
    }
  };
}
