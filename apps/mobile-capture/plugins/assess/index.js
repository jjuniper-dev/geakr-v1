import { getProvider } from '../../core/llm-adapter/index.js';
import { audit } from '../../core/audit-compliance/index.js';

export class AssessPlugin {
  constructor(config = {}) {
    this.name = 'assess';
    this.config = config;
    this.llm = getProvider();
  }

  async execute({ structured, markdown, context }) {
    if (!structured || !structured.title) {
      throw new Error('AssessPlugin requires structured knowledge with title');
    }

    const startTime = Date.now();

    const prompt = `You are an assessment expert. Analyze the following knowledge extraction and provide:
1. Relevance score (0-100) for government/architecture contexts
2. Key risks or concerns
3. Recommended actions

Knowledge:
Title: ${structured.title}
Summary: ${structured.summary.join('; ')}
Key Points: ${structured.key_points.join('; ')}
Concepts: ${structured.concepts.join(', ')}

Respond with JSON: { relevanceScore: number, risks: string[], recommendations: string[] }`;

    const assessment = await this.llm.structuredExtract({
      schema: {
        type: 'object',
        properties: {
          relevanceScore: { type: 'number', minimum: 0, maximum: 100 },
          risks: { type: 'array', items: { type: 'string' }, maxItems: 5 },
          recommendations: { type: 'array', items: { type: 'string' }, maxItems: 5 }
        },
        required: ['relevanceScore', 'risks', 'recommendations']
      },
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    const duration = Date.now() - startTime;

    await audit.logPluginExecution({
      pluginName: this.name,
      input: { title: structured.title, conceptCount: structured.concepts.length },
      output: assessment,
      duration,
      userId: 'system'
    });

    return {
      plugin: this.name,
      assessment,
      duration,
      timestamp: new Date().toISOString()
    };
  }
}

export default AssessPlugin;
